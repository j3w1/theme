#!/usr/bin/env node
// Prints the commit of the last successful github-pages deployment, or
// nothing. select diffs a push to main against it, so a change that never
// reached Pages is still counted by the next push.

const [repo] = process.argv.slice(2);
const headers = { accept: "application/vnd.github+json", authorization: `Bearer ${process.env.GH_TOKEN}` };
const get = async (url) => {
  const res = await fetch(`https://api.github.com${url}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};
const deployments = await get(`/repos/${repo}/deployments?environment=github-pages&per_page=30`);
for (const d of deployments) {
  const statuses = await get(`/repos/${repo}/deployments/${d.id}/statuses?per_page=5`);
  if (statuses[0]?.state === "success") { process.stdout.write(d.sha); process.exit(0); }
}
process.exit(1);
