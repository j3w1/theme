/* The only place BASE_URL is joined. `trailingSlash: "always"` makes
   import.meta.env.BASE_URL "/theme/"; this helper tolerates both forms so a
   config change cannot silently produce "/themeexports/…". */

export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, "/");

export const withBase = (path: string): string => `${BASE}${path.replace(/^\//, "")}`;

export const anchor = (id: string): string => `#${id}`;
