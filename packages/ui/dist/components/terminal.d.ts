import { J3w1Element } from '../element.js';
export declare class J3w1Terminal extends J3w1Element { static readonly componentId: 'terminal'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  setText(text: string): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-terminal': J3w1Terminal; } }
