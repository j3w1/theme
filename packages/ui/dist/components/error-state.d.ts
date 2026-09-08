import { J3w1Element } from '../element.js';
export declare class J3w1ErrorState extends J3w1Element { static readonly componentId: 'error-state'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  dismiss(id?: string): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-error-state': J3w1ErrorState; } }
