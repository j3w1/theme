import { J3w1Element } from '../element.js';
export declare class J3w1SearchField extends J3w1Element { static readonly componentId: 'search-field'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  clear(): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-search-field': J3w1SearchField; } }
