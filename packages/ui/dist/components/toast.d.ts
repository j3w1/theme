import { J3w1Element } from '../element.js';
export declare class J3w1Toast extends J3w1Element { static readonly componentId: 'toast'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  dismiss(id?: string): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-toast': J3w1Toast; } }
