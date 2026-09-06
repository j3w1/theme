/* The only module that touches localStorage. Keys are namespaced under
   j3w1-theme:* so the page never reads or writes another origin-sharing
   page's state. Every access is guarded: storage can be absent or throw. */

export const PREFIX = "j3w1-theme:";

export const KEYS = {
  density: `${PREFIX}density`,
  profile: `${PREFIX}profile`,
} as const;

export const get = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const set = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the preference simply does not persist */
  }
};

export const clearAll = (): void => {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) doomed.push(key);
    }
    for (const key of doomed) localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
};
