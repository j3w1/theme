import { J3w1Element } from '../element.js';
export declare class J3w1Wizard extends J3w1Element { static readonly componentId: 'wizard'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  next(): boolean;
  back(): void;
  step: number;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-wizard': J3w1Wizard; } }
