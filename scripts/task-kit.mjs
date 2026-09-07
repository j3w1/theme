#!/usr/bin/env node
import { parseArgs } from "node:util";
import { pinnedKitSource } from "./lib/task-kit-source.mjs";
import { buildTaskKit } from "./lib/task-kit.mjs";
import { writeNewKit } from "./lib/safe-kit-writer.mjs";

try {
  const { values } = parseArgs({ options: { components: { type: "string" }, task: { type: "string" }, out: { type: "string" }, ref: { type: "string" }, profile: { type: "string", default: "default" }, mode: { type: "string", default: "standard" }, "integration-id": { type: "string" }, "integration-version": { type: "string" }, "integration-kind": { type: "string", default: "css-vars" } }, allowPositionals: false });
  if (!values.out || !values.components || !values.task || !values["integration-id"] || !values["integration-version"]) throw new Error("Required: --components id,id --task text --integration-id name --integration-version version --out NEW_DIRECTORY. Optional: --ref FULL_COMMIT_OR_TAG --profile default --mode standard|minimal --integration-kind css-vars.");
  const source = await pinnedKitSource(values.ref ?? null);
  const index = JSON.parse(await source.read("exports/task-inputs.json"));
  const kit = await buildTaskKit({ index, read: source.read, request: { revision: source.revision, resolvedAt: source.resolvedAt, profile: values.profile, mode: values.mode, components: values.components.split(","), task: values.task, integration: { id: values["integration-id"], version: values["integration-version"], kind: values["integration-kind"] } } });
  const target = await writeNewKit(values.out, kit.files);
  console.log(`Task kit at ${source.revision} written to ${target}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
