#!/usr/bin/env node
import { main } from "./scripts/lib/port-setup.mjs";

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  console.error(`Setup stopped: ${error.message}`);
  process.exitCode = 1;
}
