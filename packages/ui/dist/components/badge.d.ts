import { J3w1Element } from '../element.js';
export declare class J3w1Badge extends J3w1Element { static readonly componentId: 'badge'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-badge': J3w1Badge; } }
