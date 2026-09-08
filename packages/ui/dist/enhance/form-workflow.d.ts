export interface WorkflowField {
  id: string;
  type: "text" | "textarea" | "checkbox" | "select" | "radio";
  label: string;
  required: boolean;
  options: { id: string; label: string }[];
  help: string;
}
export interface WorkflowState {
  stage: "editing" | "invalid" | "review" | "busy" | "success";
  values: Record<string, string | boolean>;
  errors: Record<string, string>;
  announcement: string;
}
export declare function mountWorkflow(root: HTMLElement, options: {
  fields: WorkflowField[];
  templates: Record<string, string>;
  prefix: string;
  validate?: (fields: WorkflowField[], values: WorkflowState["values"]) => WorkflowState["errors"];
  signal?: AbortSignal;
}): { getState(): WorkflowState; destroy(): void };
