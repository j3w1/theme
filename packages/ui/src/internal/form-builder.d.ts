export interface BuilderController {
  exportDefinition(): string;
  importDefinition(text: string): boolean;
  destroy(): void;
}
export declare function mountBuilder(root: HTMLElement, options?: { signal?: AbortSignal }): BuilderController;
