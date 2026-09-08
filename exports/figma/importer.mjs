// j3w1 theme 1.0.0; generated from the independently authored Variables adapter.
// Independently authored Variables API adapter. No network, plugin data or implicit apply.
// Keep the returned receipt outside the document and pass it back explicitly.
export async function importFigmaVariables(figma, { payload, receipt = null, action = "dry-run", documentKey }) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const copy = value => JSON.parse(JSON.stringify(value));
  if (!["dry-run", "apply", "rollback"].includes(action)) throw new Error("Unknown import action.");
  if (!documentKey || !payload || payload.schemaVersion !== 1 || payload.mappingVersion !== 1 || payload.profile !== "default" || payload.collection !== "j3w1/theme/default/v1" || payload.mode !== "Default" || !/^[a-f0-9]{40}$/.test(payload.revision)) throw new Error("Unsupported payload or document identity.");
  if (!Array.isArray(payload.variables) || payload.variables.length > 8) throw new Error("This reviewed import route supports at most eight variables, including alias dependencies, per namespace.");
  const ids = new Set(), types = new Map();
  for (const variable of payload.variables) {
    if (!/^[a-z][a-z0-9.-]*$/.test(variable.id) || ids.has(variable.id) || variable.name !== variable.id.replaceAll(".", "/") || !["COLOR", "FLOAT"].includes(variable.type) || !Array.isArray(variable.scopes)) throw new Error("Invalid or duplicate variable identity.");
    if (variable.value?.alias && !ids.has(variable.value.alias)) throw new Error("Aliases must follow their declared dependencies.");
    const primitive = variable.id.startsWith("color.primitive.");
    if (variable.dependencyOnly !== primitive || (primitive && variable.scopes.length) || !["use", "use-and-report", ...(primitive ? ["blocked"] : [])].includes(variable.eligibility?.action)) throw new Error("Unsupported eligibility or primitive scope.");
    const allowedScopes = variable.type === "COLOR" ? ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"] : ["GAP", "CORNER_RADIUS"];
    if (variable.scopes.some(scope => !allowedScopes.includes(scope))) throw new Error("Unsupported property scope.");
    if (variable.value?.alias) { if (types.get(variable.value.alias) !== variable.type) throw new Error("Alias type mismatch."); }
    else if (variable.type === "FLOAT") { if (!Number.isFinite(variable.value) || variable.value < 0 || !/^(space|radius)\./.test(variable.id)) throw new Error("Invalid scalar spacing or radius."); }
    else if (!variable.value || Object.keys(variable.value).sort().join() !== "a,b,g,r" || Object.values(variable.value).some(value => !Number.isFinite(value) || value < 0 || value > 1)) throw new Error("Invalid sRGB color.");
    ids.add(variable.id); types.set(variable.id, variable.type);
  }
  if (receipt && (receipt.schemaVersion !== 1 || receipt.documentKey !== documentKey || receipt.collectionName !== payload.collection)) throw new Error("Receipt belongs to a different document or namespace.");
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const all = await figma.variables.getLocalVariablesAsync();
  const snapshot = variable => ({ id: variable.id, name: variable.name, collectionId: variable.variableCollectionId, type: variable.resolvedType, description: variable.description, scopes: [...variable.scopes], values: copy(variable.valuesByMode) });
  let collection = receipt ? collections.find(item => item.id === receipt.collectionId) : null;
  if (receipt && (!collection || collection.name !== receipt.collectionName || collection.modes.length !== 1 || collection.defaultModeId !== receipt.modeId || collection.modes[0].name !== "Default")) throw new Error("Owned collection is detached or manually edited; no changes made.");
  if (!receipt && collections.some(item => item.name === payload.collection)) throw new Error("Namespace already exists without its ownership receipt; no adoption or overwrite.");
  const owned = new Map((receipt?.entries ?? []).map(entry => [entry.tokenId, entry]));
  if (new Set([...owned.keys(), ...ids]).size > 8) throw new Error("The owned namespace would exceed the eight-variable limit.");
  for (const entry of owned.values()) {
    const actual = all.find(variable => variable.id === entry.after.id);
    if (!actual || actual.variableCollectionId !== collection.id || !same(snapshot(actual), entry.after)) throw new Error(`Detached or manually edited variable ${entry.tokenId}; no changes made.`);
  }
  const collectionVariables = collection ? all.filter(variable => variable.variableCollectionId === collection.id) : [];
  const unowned = collectionVariables.filter(variable => ![...owned.values()].some(entry => entry.after.id === variable.id));
  const describe = variable => JSON.stringify({ tokenId: variable.id, mappingVersion: payload.mappingVersion, dependencyOnly: variable.dependencyOnly, eligibility: variable.eligibility });
  const desiredValue = (variable, mapping) => variable.value?.alias ? { type: "VARIABLE_ALIAS", id: mapping.get(variable.value.alias) } : copy(variable.value);
  const diff = [];
  if (action === "rollback") {
    if (!receipt) throw new Error("Rollback requires the current ownership receipt.");
    if (unowned.length && receipt.createdCollection) throw new Error("Collection contains unrelated variables; rollback will not delete it.");
    const removedIds = new Set(receipt.changes.filter(entry => !entry.before).map(entry => entry.after.id));
    for (const variable of all.filter(item => !removedIds.has(item.id))) {
      const restored = receipt.changes.find(entry => entry.after.id === variable.id)?.before;
      const values = restored?.values ?? variable.valuesByMode;
      if (Object.values(values).some(value => value?.type === "VARIABLE_ALIAS" && removedIds.has(value.id))) throw new Error("A retained or unrelated variable aliases a rollback target; no changes made.");
    }
    for (const entry of receipt.changes) diff.push({ tokenId: entry.tokenId, operation: entry.before ? "restore" : "remove" });
  } else {
    const mapping = new Map([...owned].map(([id, entry]) => [id, entry.after.id]));
    for (const variable of payload.variables) {
      const entry = owned.get(variable.id);
      if (unowned.some(item => item.name === variable.name)) throw new Error("Unowned variable name collision; no changes made.");
      if (!entry) { diff.push({ tokenId: variable.id, operation: "create", after: variable }); mapping.set(variable.id, `pending:${variable.id}`); }
      else {
        if (entry.after.type !== variable.type) throw new Error("Variable type changes require a new reviewed mapping version.");
        // Same source value and metadata are an exact no-op even if the API represents a color as float32.
        if (!same(entry.definition, variable)) diff.push({ tokenId: variable.id, operation: "update", before: entry.definition, after: variable });
      }
    }
  }
  const report = { action, revision: payload.revision, mappingVersion: payload.mappingVersion, sourceDigests: payload.sourceDigests, payloadDigest: payload.payloadDigest, unsupported: payload.unsupported, excludedProfiles: payload.excludedProfiles, limits: payload.limits, diff, retained: [...owned.keys()].filter(id => !ids.has(id)), changedIds: [] };
  if (action === "dry-run") return { ...report, receipt };
  if (action === "rollback") {
    for (const entry of [...receipt.changes].reverse()) {
      const variable = all.find(item => item.id === entry.after.id);
      if (!entry.before) variable.remove();
      else { variable.name = entry.before.name; variable.description = entry.before.description; variable.scopes = entry.before.scopes; variable.setValueForMode(receipt.modeId, entry.before.values[receipt.modeId]); }
      report.changedIds.push(entry.after.id);
    }
    if (receipt.createdCollection) { report.changedIds.push(collection.id); collection.remove(); }
    return { ...report, receipt: receipt.previousReceipt };
  }
  if (!diff.length) return { ...report, receipt };
  const createdCollection = !collection;
  if (!collection) {
    collection = figma.variables.createVariableCollection(payload.collection); collection.renameMode(collection.defaultModeId, "Default"); report.changedIds.push(collection.id);
  }
  const entries = new Map(owned), changes = [], mapping = new Map([...owned].map(([id, entry]) => [id, entry.after.id]));
  for (const change of diff) {
    const definition = payload.variables.find(item => item.id === change.tokenId), old = owned.get(change.tokenId);
    const variable = old ? all.find(item => item.id === old.after.id) : figma.variables.createVariable(definition.name, collection, definition.type);
    variable.name = definition.name; variable.description = describe(definition); variable.scopes = definition.scopes;
    variable.setValueForMode(collection.defaultModeId, desiredValue(definition, mapping)); mapping.set(definition.id, variable.id);
    const entry = { tokenId: definition.id, definition: copy(definition), before: old?.after ?? null, after: snapshot(variable) };
    entries.set(definition.id, entry); changes.push(entry); report.changedIds.push(variable.id);
  }
  const nextReceipt = { schemaVersion: 1, documentKey, collectionName: payload.collection, collectionId: collection.id, modeId: collection.defaultModeId, revision: payload.revision, payloadDigest: payload.payloadDigest, entries: [...entries.values()], changes, createdCollection, previousReceipt: receipt };
  return { ...report, receipt: nextReceipt };
}
