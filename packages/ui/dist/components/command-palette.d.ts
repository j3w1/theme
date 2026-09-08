import { J3w1Element } from '../element.js';
export declare class J3w1CommandPalette extends J3w1Element { static readonly componentId: 'command-palette'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  show(): void;
  close(): void;
  open: boolean;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-command-palette': J3w1CommandPalette; } }
