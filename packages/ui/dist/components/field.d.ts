import { J3w1Element } from '../element.js';
export declare class J3w1Field extends J3w1Element { static readonly componentId: 'field'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-field': J3w1Field; } }
