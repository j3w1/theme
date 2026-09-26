// Merges the blob reports of every browser shard into one run, and only here
// writes the execution evidence (D-031). The shards never run the evidence
// reporter, so no shard can publish a partial matrix.
export default {
  testDir: "./tests/browser",
  reporter: [["list"], ["./tests/evidence-reporter.mjs"], ["html", { open: "never" }]],
};
