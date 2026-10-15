/* Progressive enhancement entry. Everything normative is already in the
   HTML; these modules add search, family filters, the token inspector, copy
   buttons, density and profile switches, reset, and print behaviour. */

import { initSearch } from "./search";
import { initFilter } from "./filter";

import { initDensity } from "./density";
import { initProfile } from "./profile";
import { initReset } from "./reset";
import { initPrint } from "./print";
import { initToc } from "./toc";
import { initWorkbenchEntry } from "./workbench-entry";


/* The shared layout has already marked <html> with .js. */

initDensity();
initProfile();
initSearch();
initFilter();
initReset();
initPrint();
initToc();
initWorkbenchEntry();

