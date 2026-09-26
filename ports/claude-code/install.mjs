#!/usr/bin/env node
/* Installs, checks, updates and takes out the j3w1 theme for Claude Code on this
   machine, from one commit of this checkout. See README.md next to this
   file, or run: node ports/claude-code/install.mjs help */

import { main } from "../../scripts/lib/host-install/cli.mjs";

process.exitCode = await main("claude-code", process.argv.slice(2));
