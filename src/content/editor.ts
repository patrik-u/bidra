import { validatePublication } from "./publication";
import { initiativeCategories, type InitiativeDraft } from "./initiative";
type ManagedAppView = { id: string; name: string };
let requestContent: typeof fetch = fetch;
export function setContentRequest(request: typeof fetch) { requestContent = request; }

export interface AppContentPage {
  offset: number;
  hasMore: boolean;
  documents: Array<{ id: string; entityId: string; version: number; editVersion: number; payload: InitiativeDraft; publishedRevisionId: string | null }>;
}
const h = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
const selected = (page: AppContentPage) => page.documents.find(item => item.entityId === new URLSearchParams(location.search).get("entity"));
const link = (id: string, entity = "", offset = 0) => `/cloud-content?${new URLSearchParams({ app: id, ...(entity ? { entity } : {}), offset: String(offset) })}`;

export function appContentTemplate(app: ManagedAppView | undefined, page: AppContentPage | null) {
  if (!app || !page) return `<section class="card"><h1>Innehållet kunde inte öppnas</h1><p>Kontrollera att appen har Content aktiverat och att du har åtkomst.</p><a href="/">Till Mina appar</a></section>`;
  const current = selected(page);
  const draft = current?.payload ?? { title: "", category: "natur", scope: "national" };
  const field = (name: keyof InitiativeDraft, label: string, max: number, type = "text") => `<div class="field"><label for="content-${name}">${label}</label><input id="content-${name}" name="${name}" type="${type}" maxlength="${max}" value="${h(draft[name])}" ${name === "title" ? "required" : ""}></div>`;
  const textarea = (name: keyof InitiativeDraft, label: string, max: number) => `<div class="field"><label for="content-${name}">${label}</label><textarea id="content-${name}" name="${name}" maxlength="${max}" rows="3">${h(draft[name])}</textarea></div>`;
  return `<section class="dashboard-page app-content-page"><a href="/" class="hint">Bidrakartan / ${h(app.name)}</a><h1>Initiativ</h1><p class="hint">Hantera initiativen som visas på kartan. Utkast är privata tills du publicerar dem.</p>
    <div class="app-content-layout"><aside class="card app-content-list"><a class="button secondary" href="${link(app.id)}">Nytt initiativ</a>
      ${page.documents.length ? page.documents.map(item => `<a class="content-list-item ${current?.entityId === item.entityId ? "active" : ""}" href="${link(app.id, item.entityId, page.offset)}"><strong>${h(item.payload.title)}</strong><span>${!item.publishedRevisionId ? "Utkast" : item.publishedRevisionId === item.id ? "Publicerat" : "Publicerat · nytt utkast"}</span></a>`).join("") : `<p class="hint">Inga initiativ ännu. Börja med ett utkast.</p>`}
      <div class="button-row">${page.offset > 0 ? `<a href="${link(app.id, "", Math.max(0, page.offset - 50))}">Föregående</a>` : ""}${page.hasMore ? `<a href="${link(app.id, "", page.offset + 50)}">Nästa</a>` : ""}</div>
    </aside><div class="card app-content-editor"><h2>${current ? "Redigera initiativ" : "Nytt utkast"}</h2><p class="hint">Utkast och granskningsanteckningar kan bara läsas av appens ägare och administratörer.</p>
      <form id="app-content-draft">${field("title", "Rubrik", 160)}${field("organization", "Organisation", 160)}
        <div class="content-field-pair"><div class="field"><label for="content-category">Område</label><select id="content-category" name="category">${Object.entries(initiativeCategories).map(([key, label]) => `<option value="${key}" ${draft.category === key ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="field"><label for="content-scope">Verksamhet</label><select id="content-scope" name="scope"><option value="national" ${draft.scope !== "local" ? "selected" : ""}>Rikstäckande</option><option value="local" ${draft.scope === "local" ? "selected" : ""}>Lokal</option></select></div></div>
        ${field("region", "Ort eller region", 160)}${textarea("geography", "Vad visar platsen på kartan?", 2000)}
        <div class="content-field-pair"><div class="field"><label for="content-lon">Longitud (lokala initiativ)</label><input id="content-lon" name="longitude" type="number" step="any" min="-180" max="180" value="${h(draft.coordinates?.[0])}"></div><div class="field"><label for="content-lat">Latitud</label><input id="content-lat" name="latitude" type="number" step="any" min="-85" max="85" value="${h(draft.coordinates?.[1])}"></div></div>
        ${textarea("summary", "Kort beskrivning", 600)}${textarea("contribution", "Så kan man bidra", 2000)}${field("source", "Källans webbadress", 2000, "url")}${field("donate", "Webbadress för att bidra", 2000, "url")}
        <fieldset><legend>Sätt att bidra</legend>${["pengar", "tid"].map(value => `<label class="content-check"><input type="checkbox" name="giving" value="${value}" ${draft.giving?.includes(value as "pengar" | "tid") ? "checked" : ""}>${value === "pengar" ? "Pengar" : "Tid"}</label>`).join("")}</fieldset>
        <div class="field"><label for="content-keywords">Sökord, separerade med kommatecken</label><input id="content-keywords" name="keywords" value="${h(draft.keywords?.join(", "))}"></div>
        <button class="button" type="submit">Spara utkast</button><span id="content-dirty" class="hint" hidden>Spara ändringarna innan du publicerar.</span>
      </form>
      ${current ? `<details class="app-config-section"><summary>Granska och publicera</summary><form id="app-content-publish"><p>Publicering gör den senast sparade versionen läsbar utan konto via Clouds innehållsadress. Utkastet och dina anteckningar följer inte med. Det publicerade initiativet visas på Bidrakartans startsida.</p>${[["identity", "Organisationens identitet är kontrollerad"], ["source", "Beskrivningen stöds av källan"], ["geography", "Platsen beskriver verksamheten korrekt"], ["donation", "Länken och sättet att bidra är kontrollerade"]].map(([key, label]) => `<label class="content-check"><input type="checkbox" name="${key}" required>${label}</label>`).join("")}<div class="field"><label for="source-read">Datum när källan lästes</label><input id="source-read" name="sourceReadAt" type="date" max="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label for="review-note">Intern granskningsanteckning</label><textarea id="review-note" name="note" minlength="15" maxlength="2000" required rows="3"></textarea></div><button class="button" type="submit">Publicera på Bidrakartan</button></form></details>
      ${current.publishedRevisionId ? `<details class="app-config-section"><summary>Avpublicera</summary><form id="app-content-unpublish"><p>Tar bort den öppna versionen. Utkast och historik bevaras.</p><div class="field"><label for="unpublish-note">Orsak</label><input id="unpublish-note" name="note" minlength="5" maxlength="2000" required></div><button class="button secondary" type="submit">Avpublicera initiativet</button></form></details>` : ""}
      <details class="app-config-section"><summary>Historik</summary><button type="button" class="button secondary" id="content-load-history">Visa senaste ändringarna</button><div id="content-history"></div></details>` : ""}
      <p id="app-content-error" class="error" role="alert" hidden></p>
    </div></div></section>`;
}

export function bindAppContent(app: ManagedAppView | undefined, page: AppContentPage | null, csrf: string, refresh: () => Promise<void>) {
  if (!app || !page) return;
  const current = selected(page);
  let pending = false;
  const error = document.querySelector<HTMLElement>("#app-content-error")!;
  const base = `/api/managed-apps/${encodeURIComponent(app.id)}`;
  const showError = (cause: unknown) => { error.textContent = cause instanceof Error ? cause.message : "Ändringen kunde inte sparas."; error.hidden = false; };
  for (const action of ["draft", "publish", "unpublish"]) document.querySelector<HTMLFormElement>(`#app-content-${action}`)?.addEventListener("submit", async event => {
    event.preventDefault();
    if (pending) return;
    pending = true; error.hidden = true;
    const form = event.currentTarget as HTMLFormElement;
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    button.disabled = true;
    const data = new FormData(form);
    const body: Record<string, unknown> = { templateId: "vibe.initiative.v1", action: action === "draft" ? "save" : action, ...(current ? { entityId: current.entityId } : {}), version: current?.editVersion ?? 0 };
    if (action === "draft") {
      const payload: Record<string, unknown> = {};
      for (const name of ["title", "organization", "category", "region", "scope", "geography", "summary", "contribution", "source", "donate"]) payload[name] = String(data.get(name) ?? "").trim();
      payload.keywords = String(data.get("keywords") ?? "").split(",").map(word => word.trim()).filter(Boolean);
      payload.giving = data.getAll("giving");
      if (payload.scope === "local" && data.get("longitude") !== "" && data.get("latitude") !== "") payload.coordinates = [Number(data.get("longitude")), Number(data.get("latitude"))];
      if (current?.payload.image) payload.image = current.payload.image;
      body.payload = payload;
    } else {
      body.note = data.get("note");
      if (action === "publish") { body.metadata = { sourceReadAt: data.get("sourceReadAt"), note: body.note, checks: Object.fromEntries(["identity", "source", "geography", "donation"].map(key => [key, data.get(key) === "on"])) }; }
    }
    try {
      if (action === "publish") validatePublication(current!.entityId, current!.payload, (body.metadata as { sourceReadAt: unknown }).sourceReadAt);
      const response = await requestContent(`${base}/content`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string; document: { entityId: string } };
      if (!response.ok) throw new Error(result.error);
      history.replaceState({}, "", link(app.id, result.document.entityId));
      await refresh();
    } catch (cause) { showError(cause); button.disabled = false; }
    finally { pending = false; }
  });
  document.querySelector("#app-content-draft")?.addEventListener("input", () => {
    const publish = document.querySelector<HTMLButtonElement>("#app-content-publish button[type=submit]");
    if (publish) publish.disabled = true;
    document.querySelector<HTMLElement>("#content-dirty")!.hidden = false;
  });
  document.querySelector("#content-load-history")?.addEventListener("click", async () => {
    try {
      const response = await requestContent(`${base}/content-history?${new URLSearchParams({ entityId: current!.entityId })}`);
      if (!response.ok) throw new Error("Historiken kunde inte läsas.");
      const { events } = await response.json() as { events: { action: string; note: string; createdAt: string }[] };
      document.querySelector("#content-history")!.innerHTML = events.map(item => `<div class="content-history-event"><strong>${h(({ save: "Utkast sparat", publish: "Publicerat", unpublish: "Avpublicerat" } as Record<string, string>)[item.action])}</strong><span>${h(new Date(item.createdAt).toLocaleString("sv-SE"))}</span><p>${h(item.note)}</p></div>`).join("");
    } catch (cause) { showError(cause); }
  });
}
