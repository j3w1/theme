# CI

How CI picks the checks a change runs (D-031). `scripts/ci/select.mjs`
computes the plan; run it before you push:

```
node scripts/ci/select.mjs --event pull_request --base origin/main --head HEAD
```

CI is `select` → checks → `release-gate`.

- `select` reads the changed paths and `scripts/ci/proofs.json`; a path gets
  cheaper only when a rule claims it. Unclaimed paths and control files
  (workflows, the selector and registry, `package.json`, the lockfile, the
  Playwright configs) run every check. On a pull request the base commit's
  control list also applies, so a change cannot make itself cheaper. A file a
  browser spec imports runs that spec and counts as a site change.
- A pull request runs only the selected checks, unit tests and build in
  parallel; browser subsets write no evidence (D-028).
- A push to `main` that changes the site runs the whole matrix in shards
  (desktop in four parts; projects read from the Playwright config), with
  packed consumers in parallel. Blob reports merge once into the evidence
  reporter, which refuses a missing shard or configured test; then the
  verification report and deployment. No site change, no deployment. Changed
  paths count from the last commit that reached Pages.
- `release-gate`, the only required check, recomputes the plan from Git with
  the same code and checks each job ran as planned and passed.
- `fullyParallel`, two workers per CI job, zero retries. The page axe scan is
  two tests (colour contrast; every other rule) covering exactly the tagged
  rules. Only an unnarrowed `playwright test`, or the merge of every shard,
  writes evidence.
