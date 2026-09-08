import { J3w1Element } from '../element.js';
export declare class J3w1EditorSearch extends J3w1Element { static readonly componentId: 'editor-search'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  next(direction?: number): void;
  source: string;
  query: string;
  readonly matchCount: number;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-editor-search': J3w1EditorSearch; } }
