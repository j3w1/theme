import { J3w1Element } from '../element.js';
export declare class J3w1Select extends J3w1Element { static readonly componentId: 'select'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  clear(): void;
  values: string[];
}
declare global { interface HTMLElementTagNameMap { 'j3w1-select': J3w1Select; } }
