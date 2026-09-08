import { J3w1Element } from '../element.js';
export declare class J3w1Range extends J3w1Element { static readonly componentId: 'range'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  clear(): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-range': J3w1Range; } }
