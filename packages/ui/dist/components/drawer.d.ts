import { J3w1Element } from '../element.js';
export declare class J3w1Drawer extends J3w1Element { static readonly componentId: 'drawer'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  show(): void;
  close(value?: string): void;
  open: boolean;
  readonly returnValue: string;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-drawer': J3w1Drawer; } }
