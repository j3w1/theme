import { J3w1Element } from '../element.js';
export declare class J3w1Diagnostics extends J3w1Element { static readonly componentId: 'diagnostics'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  setText(text: string): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-diagnostics': J3w1Diagnostics; } }
