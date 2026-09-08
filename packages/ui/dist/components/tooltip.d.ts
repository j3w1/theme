import { J3w1Element } from '../element.js';
export declare class J3w1Tooltip extends J3w1Element { static readonly componentId: 'tooltip'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  show(): void;
  hide(): void;
  readonly open: boolean;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-tooltip': J3w1Tooltip; } }
