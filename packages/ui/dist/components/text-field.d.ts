import { J3w1Element } from '../element.js';
export declare class J3w1TextField extends J3w1Element { static readonly componentId: 'text-field'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  clear(): void;
  stepBy(amount: number): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-text-field': J3w1TextField; } }
