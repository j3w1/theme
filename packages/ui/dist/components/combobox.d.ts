import { J3w1Element } from '../element.js';
export declare class J3w1Combobox extends J3w1Element { static readonly componentId: 'combobox'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  show(allOptions?: boolean): void;
  hide(): void;
  value: string;
  open: boolean;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-combobox': J3w1Combobox; } }
