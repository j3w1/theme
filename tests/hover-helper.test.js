import assert from "node:assert/strict";
import test from "node:test";
import { HOVER_HELPER, followPoint, anchorPoint, canScroll } from "../packages/ui/src/internal/hover-helper.js";

/* D-042: the placement every hover helper shares. The browser specs drive the
   live behaviour; these pin the arithmetic a consumer copies. */
const view = { width: 1000, height: 800 };
const size = { width: 200, height: 100 };

test("the standard is 12px from the pointer, an 8px gutter and a 300 ms tooltip delay", () => {
  assert.equal(HOVER_HELPER.offset, 12);
  assert.equal(HOVER_HELPER.gutter, 8);
  assert.equal(HOVER_HELPER.openDelay, 300);
  assert.equal(HOVER_HELPER.maxBlock, "40vh");
  assert.equal(HOVER_HELPER.maxInline, "24rem");
});

test("a following helper sits 12px right of and below the pointer", () => {
  assert.deepEqual(followPoint({ x: 100, y: 100 }, size, view), { left: 112, top: 112 });
});

test("it flips left near the right edge and up near the bottom edge", () => {
  assert.deepEqual(followPoint({ x: 900, y: 100 }, size, view), { left: 900 - 12 - 200, top: 112 });
  assert.deepEqual(followPoint({ x: 100, y: 750 }, size, view), { left: 112, top: 750 - 12 - 100 });
  assert.deepEqual(followPoint({ x: 990, y: 790 }, size, view), { left: 990 - 12 - 200, top: 790 - 12 - 100 });
});

test("it is never clipped: with no room on either side it keeps the gutter", () => {
  const wide = { width: 900, height: 700 };
  const at = followPoint({ x: 500, y: 400 }, wide, view);
  assert.ok(at.left >= 8 && at.left + wide.width <= view.width - 8, JSON.stringify(at));
  assert.ok(at.top >= 8 && at.top + wide.height <= view.height - 8, JSON.stringify(at));
  const near = followPoint({ x: 2, y: 2 }, size, view);
  assert.deepEqual(near, { left: 14, top: 14 });
});

test("right-to-left mirrors the inline side", () => {
  assert.deepEqual(followPoint({ x: 500, y: 100 }, size, view, { rtl: true }), { left: 500 - 12 - 200, top: 112 });
  assert.deepEqual(followPoint({ x: 100, y: 100 }, size, view, { rtl: true }), { left: 112, top: 112 });
});

test("without a pointer it anchors below its trigger, above when there is no room", () => {
  const rect = { left: 300, right: 360, top: 200, bottom: 224 };
  assert.deepEqual(anchorPoint(rect, size, view), { left: 300, top: 228 });
  const low = { left: 300, right: 360, top: 740, bottom: 764 };
  assert.deepEqual(anchorPoint(low, size, view), { left: 300, top: 740 - 4 - 100 });
  const edge = { left: 950, right: 990, top: 200, bottom: 224 };
  assert.equal(anchorPoint(edge, size, view).left, 1000 - 200 - 8);
  assert.equal(anchorPoint(rect, size, view, { rtl: true }).left, 360 - 200);
});

test("the wheel scrolls a helper only while it can still scroll that way", () => {
  const box = (scrollTop, clientHeight, scrollHeight) => ({ scrollTop, clientHeight, scrollHeight });
  assert.equal(canScroll(box(0, 100, 300), 40), true);
  assert.equal(canScroll(box(0, 100, 300), -40), false);
  assert.equal(canScroll(box(200, 100, 300), 40), false);
  assert.equal(canScroll(box(200, 100, 300), -40), true);
  assert.equal(canScroll(box(0, 100, 100), 40), false);
  assert.equal(canScroll(box(50, 100, 300), 0), false);
});

test("F10: the size cap comes from the same viewport the placement uses", async () => {
  const { helperLimits } = await import("../packages/ui/src/internal/hover-helper.js");
  assert.equal(typeof helperLimits, "function");
  assert.deepEqual(helperLimits({ width: 305, height: 600 }), { maxInlineSize: "min(24rem, 289px)", maxBlockSize: "min(40vh, 584px)" });
});
