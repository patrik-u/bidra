type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export const INITIATIVE_CONTENT_ID = "vibe.initiative.v1";
export const initiativeCategories = { natur: "Natur", manniskor: "Människor", djur: "Djur", klimat: "Klimat", hav: "Hav", barn: "Barn och unga" };
const text = (maxLength: number) => ({ type: "string", maxLength });
export const initiativeContentSchema: Record<string, JsonValue> = {
  $schema: "https://json-schema.org/draft/2020-12/schema", $id: INITIATIVE_CONTENT_ID,
  type: "object", additionalProperties: false, required: ["title"],
  properties: {
    title: { ...text(160), minLength: 1 }, organization: text(160),
    category: { enum: Object.keys(initiativeCategories) }, region: text(160),
    scope: { enum: ["local", "national"] }, geography: text(2000), summary: text(600),
    contribution: text(2000), source: text(2000), donate: text(2000), image: text(200),
    coordinates: { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } },
    keywords: { type: "array", maxItems: 40, items: text(80) },
    giving: { type: "array", maxItems: 2, uniqueItems: true, items: { enum: ["pengar", "tid"] } },
  },
};

export interface InitiativeDraft {
  title: string;
  organization?: string;
  category?: keyof typeof initiativeCategories;
  region?: string;
  scope?: "local" | "national";
  geography?: string;
  summary?: string;
  contribution?: string;
  source?: string;
  donate?: string;
  image?: string;
  coordinates?: number[];
  keywords?: string[];
  giving?: ("pengar" | "tid")[];
}
