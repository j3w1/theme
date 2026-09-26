import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { repoRoot, stableJson } from "../scripts/lib/fs.mjs";
import { git, REVISION } from "../scripts/tooling/git.mjs";
import { subjectOfBuild, validateEvidence } from "../scripts/lib/evidence.mjs";

export default class EvidenceReporter {
  onBegin(config, suite) {
    this.startedAt = new Date().toISOString();
    // Evidence comes only from the whole suite (D-028): `playwright test` with
    // nothing that narrows or lists it, or merge-reports of every shard. The
    // check is an allowlist, so any other option counts as a subset.
    const argv = process.argv.slice(2);
    const at = argv.indexOf("test");
    const args = at >= 0 ? argv.slice(at + 1) : [];
    const valued = new Set(["--config", "-c", "--workers", "-j", "--reporter"]);
    const plain = new Set(["--headed", "--headless"]);
    const whole = at >= 0 ? args.every((a, i) => valued.has(a) || plain.has(a) || valued.has(args[i - 1]) || /^(--config|--workers|--reporter)=/.test(a)) : argv.includes("merge-reports");
    this.subset = !whole || config.shard != null;
    this.subject = subjectOfBuild();
    // A rejected subject must not become an unhandled promise while tests run.
    this.subject.catch(() => {});
    this.records = [];
    this.collectionErrors = [];
    this.tests = suite.allTests();
    this.seen = new Set();
    const revision = git(["rev-parse", "HEAD"]);
    const dirty = git(["status", "--porcelain", "--untracked-files=normal"]);
    this.revision = !dirty && REVISION.test(revision) ? revision : null;
    this.reference = process.env.GITHUB_ACTIONS === "true" && /^\d+$/.test(process.env.GITHUB_RUN_ID ?? "") ? `https://github.com/j3w1/theme/actions/runs/${process.env.GITHUB_RUN_ID}` : "local Playwright run; see recorded digests";
  }

  record(test, result) {
    const annotation = test.annotations.find((a) => a.type === "verification");
    if (!annotation) throw new Error(`Missing explicit verification scope: ${test.title}`);
    const environment = (result?.annotations ?? test.annotations).find((a) => a.type === "verification-environment");
    const project = test.parent.project();
    const file = path.relative(repoRoot, test.location.file).split(path.sep).join("/");
    const id = `e-${createHash("sha256").update(`${file}:${test.title}:${project.name}:${result?.retry ?? 0}`).digest("hex").slice(0, 24)}`;
    const status = result?.status === "passed" ? "passed" : result?.status === "skipped" ? "skipped" : result ? "failed" : "not run";
    this.records.push({ id, kind: "automated", scope: JSON.parse(annotation.description), result: status,
      reason: status === "passed" ? null : status === "skipped" ? ((result?.annotations ?? test.annotations).find((a) => a.type === "skip")?.description ?? "Skipped by the test configuration") : result ? `Playwright result: ${result.status}; inspect the referenced run and test location.` : "The selected run did not execute this test.",
      reference: this.reference, test: { file, title: test.title, line: test.location.line },
      environment: environment ? JSON.parse(environment.description) : { browser: project.use.browserName ?? "chromium", browserVersion: null, os: `${os.type()} ${os.release()} ${os.arch()}`, viewport: project.metadata?.viewport ?? project.use.viewport ?? null, project: project.name, profile: "default", density: "comfortable", javaScript: project.metadata?.javaScript ?? project.use.javaScriptEnabled !== false },
    });
  }

  onTestEnd(test, result) {
    this.seen.add(test.id);
    try { this.record(test, result); }
    catch (error) { this.collectionErrors.push(error.message); }
  }

  async onEnd(result) {
    if (this.subset) {
      console.log("Evidence not written: this run is a subset. Only the whole suite, or merge-reports of every shard, records evidence.");
      // A missing verification annotation still fails a subset run.
      if (this.collectionErrors.length) {
        console.error(this.collectionErrors.join("; "));
        return { status: "failed" };
      }
      return;
    }
    try {
      const subject = await this.subject;
      if (this.collectionErrors.length) throw new Error(this.collectionErrors.join("; "));
      await subjectOfBuild();
      for (const test of this.tests) if (!this.seen.has(test.id)) this.record(test, null);
      // Parallel workers and merged shards finish in any order; the report does not.
      const key = (r) => `${r.test.file}\u0000${String(r.test.line).padStart(6, "0")}\u0000${r.test.title}\u0000${r.environment.project ?? ""}\u0000${r.id}`;
      this.records.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
      const evidence = await validateEvidence({ schemaVersion: 1, sourceDigest: subject.sourceDigest, artifactDigest: subject.artifactDigest, revision: this.revision,
        run: { startedAt: this.startedAt, completedAt: new Date().toISOString(), result: result.status, reference: this.reference }, records: this.records });
      await fs.mkdir(path.join(repoRoot, "test-results"), { recursive: true });
      await fs.writeFile(path.join(repoRoot, "test-results/evidence.json"), stableJson(evidence));
    } catch (error) {
      console.error(`Evidence collection failed: ${error.message}`);
      await fs.mkdir(path.join(repoRoot, "test-results"), { recursive: true });
      await fs.writeFile(path.join(repoRoot, "test-results/evidence-error.json"), stableJson({ result: "failed", reason: "Evidence collection or subject validation failed; inspect the test runner log." }));
      return { status: "failed" };
    }
  }
}
