/** The hover-helper algorithm every j3w1 helper uses (D-042): follow the
 * pointer 12px after and below it, flip at viewport edges with an 8px gutter,
 * anchor to the trigger for keyboard and touch, scroll an overflowing helper
 * with the wheel over its trigger, and pin it as a non-modal popover on click,
 * tap or Enter when it overflows or holds interactive content. */
export declare const HOVER_HELPER: Readonly<{ offset: 12; gutter: 8; gap: 4; openDelay: 300; maxBlock: "40vh"; maxInline: "24rem" }>;
type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Box = { left: number; top: number };
type Placement = { offset?: number; gap?: number; gutter?: number; rtl?: boolean };
export declare function followPoint(point: Point, size: Size, viewport: Size, options?: Placement): Box;
export declare function anchorPoint(rect: DOMRectReadOnly | { top: number; right: number; bottom: number; left: number }, size: Size, viewport: Size, options?: Placement): Box;
/** The size cap, from the same viewport (documentElement client size) the placement uses. */
export declare function helperLimits(viewport: Size, options?: { gutter?: number }): { maxInlineSize: string; maxBlockSize: string };
export declare function canScroll(element: Element, delta: number): boolean;
export declare function overflows(element: Element): boolean;
export declare function interactive(element: Element, except?: Element | null): boolean;
export interface HoverHelperOptions {
  /** The trigger an event target belongs to, or null. */
  trigger(node: Element): Element | null;
  /** Fill the helper for a trigger; return false to cancel. Return synchronously when the content is ready. */
  render?(trigger: Element, helper: HTMLElement): boolean | void | Promise<boolean | void>;
  /** Pointer open delay in milliseconds: 300 for tooltips, 0 to open at once. */
  openDelay?: number;
  /** "auto" pins when the helper overflows or holds interactive content; true always; false never. */
  pin?: "auto" | boolean;
  /** Keyboard focus on a trigger opens the helper anchored. Default true. */
  focus?: boolean;
  /** A tap may pin the helper. Default true. */
  touch?: boolean;
  /** Pointer types that hover. Default ["mouse", "pen"]. */
  pointerTypes?: string[];
  /** Accessible name of the pinned helper. */
  label?(trigger: Element): string;
  closeLabel?: string;
  closeClass?: string;
  onChange?(state: { open: boolean; pinned: boolean; trigger: Element | null }): void;
}
export interface HoverHelper {
  show(trigger: Element): Promise<boolean>;
  /** Close; focus inside the helper returns to its trigger. */
  close(): void;
  pin(): void;
  readonly open: boolean;
  readonly pinned: boolean;
  readonly trigger: Element | null;
  destroy(): void;
}
export declare function hoverHelper(helper: HTMLElement, options: HoverHelperOptions): HoverHelper;
