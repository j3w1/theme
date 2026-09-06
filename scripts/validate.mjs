#!/usr/bin/env node
/* Validates the hand-authored sources without writing anything.

   Usage: node scripts/validate.mjs [manifest|decisions|tokens|docs|spec|ports|references|private ...]
   With no arguments every validator runs. Exit code 1 on the first failure
   of each requested validator; all requested validators run. */

import { VALIDATORS } from "./lib/validators.mjs";

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(VALIDATORS);

let failures = 0;
for (const name of names) {
  const validator = VALIDATORS[name];
  if (!validator) {
    console.error(`unknown validator ${name}; known: ${Object.keys(VALIDATORS).join(", ")}`);
    failures += 1;
    continue;
  }
  try {
    await validator();
    console.log(`ok ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
process.exit(failures ? 1 : 0);
