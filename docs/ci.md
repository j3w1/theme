# CI

How CI picks the checks a change runs (D-031). `scripts/ci/select.mjs`
computes the plan; run it before you push:

```
node scripts/ci/select.mjs --event pull_request --base origin/main --head HEAD
```

CI is `select` → checks → `release-gate`.

The `checks` job runs two matrix entries in parallel: `cheap` keeps source
validation, generated-file drift and the selected unit files; `install` keeps
the selected host and Orca installer suites. Each retains the 15-minute job
limit. `fail-fast: false` lets both finish, and their aggregate result must
pass before evidence or `release-gate` can pass. Proof selection, test files,
assertions and child deadlines are unchanged.

This separates installer work from the variable unit-phase duration observed
in [issue #92](https://github.com/j3w1/theme/issues/92). The same candidate's
[first attempt](https://github.com/j3w1/theme/actions/runs/44018253610/job/133821332309)
spent 696.3 seconds in units and 18.9 in host installers before the Orca phase
was cancelled at the job deadline. Its
[retry](https://github.com/j3w1/theme/actions/runs/44018253610/job/133829981875)
completed those phases in 647.9, 17.6 and 170.6 seconds. An
[earlier passing main](https://github.com/j3w1/theme/actions/runs/44014450894/job/133808966593)
used the same selected commands and test files and took 428.2, 14.9 and
164.8 seconds. Matching synthetic Windows port lifecycle cases account for
628.6 seconds of the failed unit phase versus 383.7 in that earlier pass;
these cumulative case durations are not additional phases. The logs support
serial budget exhaustion and variable unit work, without establishing why
those cases ran slower, a dependency cause, or a shared cause with #88.

The `build` job collects best-effort, labelled pre-install facts in
`${{ runner.temp }}/theme-build-npm-diagnostics/facts.txt`: Node/npm versions,
npm's `omit`, `include`, `os`, `cpu` and `libc` configuration, and a small
runtime object with Node version, platform, architecture and runtime glibc
version. Blank or null platform overrides mean automatic selection; they do
not prove npm's internal detected platform. Observed runtime facts are
separate. Failed queries are `unknown`; failed directory or file writes can
leave facts unavailable and do not gate installation or building.

Only the existing `npm ci` step sets `npm_config_logs_dir` to the sibling
`install/` directory. Default verbosity and log rotation limits stay in place;
later npm commands use their default directory and cannot rotate the retained
installation logs. On failure, the existing `build-results` artifact includes
this diagnostic root alongside `test-results/` and `playwright-report/`, with
its existing missing-file and default retention policy. Successful-job files
expire with the hosted runner; there is no success upload.

Combining workspace and runner-temp paths makes their common ancestor the
archive root. On GitHub's Ubuntu runner, its relative layout is
`_temp/theme-build-npm-diagnostics/facts.txt`,
`_temp/theme-build-npm-diagnostics/install/`,
`theme/theme/test-results/` and `theme/theme/playwright-report/`. Existing
reports keep their bytes, under the longer paths. Logs preserve only events
npm emitted; they cannot recover discarded optional-dependency errors, and
files are not guaranteed if npm cannot start/write or the runner is lost.
Retaining these diagnostics does not explain or resolve [#99](https://github.com/j3w1/theme/issues/99).

The shared Playwright action installs the locked browsers and their system
packages on each runner. Browser binaries are not restored from a cross-run
cache: different Ubuntu releases can share a browser revision while requiring
different native libraries. This follows [Playwright's CI guidance](https://playwright.dev/docs/ci#caching-browsers).

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
