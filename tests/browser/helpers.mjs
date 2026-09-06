/* Shared browser-test helpers: every page load fails on any HTTP error or
   any same-origin request outside /theme/, which catches runtime fetches the
   static scan cannot see. */

import { expect } from "@playwright/test";

export const openSpec = async (page, path = "") => {
  const bad = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === new URL(page.url() || "http://localhost:4173/theme/").origin || url.hostname === "localhost") {
      if (response.status() >= 400) bad.push(`${response.status()} ${response.url()}`);
      if (!url.pathname.startsWith("/theme/")) bad.push(`outside base: ${response.url()}`);
    }
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(path, { waitUntil: "networkidle" });
  return {
    assertClean: () => {
      expect(bad, "HTTP errors or requests outside the base path").toEqual([]);
      expect(errors, "console errors").toEqual([]);
    },
  };
};

export const only = (testInfo, ...projects) => projects.includes(testInfo.project.name);

export const rgbToHex = (rgb) => {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb;
  return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
};
