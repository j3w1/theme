#!/usr/bin/env node
/* Installs, checks, updates and takes out the j3w1 theme for Codex on this
   machine, from one commit of this checkout. See README.md next to this
   file, or run: node ports/codex/install.mjs help */

import { main } from "../../scripts/lib/host-install/cli.mjs";

process.exitCode = await main("codex", process.argv.slice(2));
