import { J3w1Element } from '../element.js';
export declare class J3w1Dialog extends J3w1Element { static readonly componentId: 'dialog'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  show(): void;
  close(value?: string): void;
  open: boolean;
  readonly returnValue: string;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-dialog': J3w1Dialog; } }
