import { J3w1Element } from '../element.js';
export declare class J3w1NumberField extends J3w1Element { static readonly componentId: 'number-field'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  clear(): void;
  stepBy(amount: number): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-number-field': J3w1NumberField; } }
