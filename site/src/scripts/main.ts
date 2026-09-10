/* Progressive enhancement entry. Everything normative is already in the
   HTML; these modules add search, family filters, the token inspector, copy
   buttons, density and profile switches, reset, and print behaviour. */

import { initSearch } from "./search";
import { initFilter } from "./filter";
import { initInspector } from "./inspector";
import { initCopy } from "./copy";
import { initDensity } from "./density";
import { initProfile } from "./profile";
import { initReset } from "./reset";
import { initPrint } from "./print";
import { initToc } from "./toc";
import { initWorkbenchEntry } from "./workbench-entry";
import { enhanceControls } from "@j3w1/ui/enhance/choice";

document.documentElement.classList.add("js");

initDensity();
initProfile();
initSearch();
initFilter();
initInspector();
initCopy();
initReset();
initPrint();
initToc();
initWorkbenchEntry();

/* The page's own chrome takes the themed controls. It is scoped to #controls
   and never the document: this page renders every component as a native
   specimen in forced states, and enhancing those would replace the very thing
   the reference exists to show. */
const chrome = document.getElementById("controls");
if (chrome) enhanceControls(chrome);
