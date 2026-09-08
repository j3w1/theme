import { J3w1Element } from '../element.js';
export declare class J3w1Checkbox extends J3w1Element { static readonly componentId: 'checkbox'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  clear(): void;
  indeterminate: boolean;
  values: string[];
}
declare global { interface HTMLElementTagNameMap { 'j3w1-checkbox': J3w1Checkbox; } }
