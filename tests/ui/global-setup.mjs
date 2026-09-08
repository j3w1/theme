import { readJson, stableJson } from "../../scripts/lib/fs.mjs";
import { promises as fs } from "node:fs";
import { verifyConsumerSubject, consumerProtocolDigest } from "../../scripts/lib/ui-evidence.mjs";
export default async function setup() {
  const consumer = await readJson(".cache/ui-consumers.json");
  await verifyConsumerSubject(consumer);
  await fs.mkdir(".cache/ui-evidence", { recursive: true });
  await fs.writeFile(".cache/ui-evidence/subject.json", stableJson({ tarballDigest: consumer.tarballDigest, fixturesDigest: consumer.fixtures.digest, protocolDigest: await consumerProtocolDigest() }));
}
