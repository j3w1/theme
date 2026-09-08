import { J3w1Element } from '../element.js';
export declare class J3w1Alert extends J3w1Element { static readonly componentId: 'alert'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  dismiss(id?: string): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-alert': J3w1Alert; } }
