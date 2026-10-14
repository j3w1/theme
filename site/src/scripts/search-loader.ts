/* Cache successful static requests; a failed request never poisons retries. */
import { withBase } from "../lib/base";
const requests = new Map<string, Promise<unknown>>();
export const loadStaticJson = <T>(url: string, valid: (value: unknown) => boolean = () => true): Promise<T> => {
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then(async (response) => {
      if (!response.ok) throw new Error(`Static data unavailable (${response.status})`);
      const data = await response.json();
      if (!valid(data)) throw new Error("Invalid static data");
      return data;
    }).catch((error) => { requests.delete(url); throw error; });
    requests.set(url, request);
  }
  return request as Promise<T>;
};
export type SearchEntry = { kind: string; id: string; commandId: string; anchor: string; title: string; label: string; category: string; href: string; family: string | null; text: string; value?: string };
export const loadSearchIndex = () => loadStaticJson<{ entries: SearchEntry[] }>(withBase("search.json"), (value) => {
  const entries = (value as { entries?: SearchEntry[] })?.entries;
  return Array.isArray(entries) && entries.every((entry) => typeof entry.id === "string" && typeof entry.text === "string" && typeof entry.href === "string" && typeof entry.label === "string" && typeof entry.category === "string" && /^[a-z0-9-]+$/.test(entry.commandId));
});
