import { J3w1Element } from '../element.js';
export declare class J3w1Popover extends J3w1Element { static readonly componentId: 'popover'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  show(): void;
  hide(focus?: boolean): void;
  open: boolean;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-popover': J3w1Popover; } }
