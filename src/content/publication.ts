import type { InitiativeDraft } from "./initiative";
export function validatePublication(id: string, draft: InitiativeDraft, sourceReadAt: unknown) {
  const required = (key: keyof InitiativeDraft) => {
    const value = draft[key];
    if (typeof value !== "string" || !value.trim()) throw new Error( `Fyll i ${key} innan publicering.`);
    return value.trim();
  };
  const url = (key: "source" | "donate") => {
    let parsed: URL;
    try { parsed = new URL(required(key)); } catch { throw new Error( "Ange fullständiga https-länkar."); }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error( "Ange fullständiga https-länkar.");
    return parsed.href;
  };
  if (typeof sourceReadAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(sourceReadAt) || !Number.isFinite(Date.parse(sourceReadAt)) || new Date(sourceReadAt).toISOString().slice(0, 10) !== sourceReadAt || sourceReadAt > new Date().toISOString().slice(0, 10)) throw new Error( "Ange datum när källan kontrollerades.");
  if (!draft.giving?.length) throw new Error( "Välj hur man kan bidra.");
  const coordinates = draft.scope === "local" ? draft.coordinates : undefined;
  if (draft.scope === "local" && (!coordinates || coordinates.length !== 2 || !coordinates.every(Number.isFinite) || Math.abs(coordinates[0]!) > 180 || Math.abs(coordinates[1]!) > 85)) throw new Error( "Kontrollera kartans koordinater.");
  if (draft.image && !/^\/images\/[a-z0-9-]+\.(jpg|png|webp)$/.test(draft.image)) throw new Error( "Ogiltig bildadress.");
  // Explicit allowlist: no actor, review note, draft status or revision history.
  return { id, title: required("title"), organization: required("organization"), category: required("category"), region: required("region"), scope: required("scope"), geography: required("geography"), summary: required("summary"), contribution: required("contribution"), source: url("source"), donate: url("donate"), sourceReadAt, giving: draft.giving, keywords: draft.keywords ?? [], ...(coordinates ? { coordinates } : {}), ...(draft.image ? { image: draft.image } : {}) };
}
