import { readJson } from "../../scripts/lib/fs.mjs";
import { verifyConsumerSubject } from "../../scripts/lib/ui-evidence.mjs";
export default async function setup() {
  await verifyConsumerSubject(await readJson(".cache/ui-consumers.json"));
}
