import { withBase } from "../lib/base";
if (location.hash && location.hash !== "#main") location.replace(withBase("reference/") + location.hash);
