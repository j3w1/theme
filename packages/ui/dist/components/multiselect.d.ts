import { J3w1Element } from '../element.js';
export declare class J3w1Multiselect extends J3w1Element { static readonly componentId: 'multiselect'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  clear(): void;
  values: string[];
}
declare global { interface HTMLElementTagNameMap { 'j3w1-multiselect': J3w1Multiselect; } }
