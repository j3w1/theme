/* Old exports retain hub anchors. Static links work without JavaScript;
   enhanced navigation follows their direct targets without a second stop. */
import { withBase } from "../lib/base";
const follow = () => {
  if (!location.hash || location.hash === "#main") return;
  if (location.pathname === withBase("")) {
    location.replace(withBase("reference/") + location.hash);
    return;
  }
  let id: string;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  const link = target instanceof HTMLAnchorElement && target.hasAttribute("data-legacy-target") ? target : target?.matches("section.component") ? target.querySelector<HTMLAnchorElement>("a[data-legacy-target]") : null;
  if (link) location.replace(link.href);
};
follow();
window.addEventListener("hashchange", follow);
