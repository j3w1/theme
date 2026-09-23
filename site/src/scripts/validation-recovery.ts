import pattern from "../../../exports/patterns/validation-recovery.json";
import { mountWorkflow } from "./form-workflow.mjs";
import { validateWorkstation } from "../../../scripts/lib/validation-recovery.mjs";
const root = document.querySelector('[data-workflow="recovery"]');
const templates = Object.fromEntries([...root.querySelectorAll("template[data-field-template]")].map(node => [node.dataset.fieldTemplate, node.innerHTML]));
mountWorkflow(root, { fields: pattern.fields, prefix: "recovery", templates, validate: validateWorkstation });
