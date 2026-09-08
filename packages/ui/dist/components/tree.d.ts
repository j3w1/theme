import { J3w1Element } from '../element.js';
export declare class J3w1Tree extends J3w1Element { static readonly componentId: 'tree'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  expand(id: string, expanded?: boolean): void;
  selectedId: string;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-tree': J3w1Tree; } }
