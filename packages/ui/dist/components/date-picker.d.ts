import { J3w1Element } from '../element.js';
export declare class J3w1DatePicker extends J3w1Element { static readonly componentId: 'date-picker'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  clear(): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-date-picker': J3w1DatePicker; } }
