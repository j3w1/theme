/** Enhance existing controls without moving or duplicating their form values.
 * Load @j3w1/ui/styles/controls.css and tokens.css. Destroy on host unmount. */
export function enhanceControls(root: HTMLElement): { refresh(): void; destroy(): void };
