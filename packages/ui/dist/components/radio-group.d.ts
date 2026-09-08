import { J3w1Element } from '../element.js';
export declare class J3w1RadioGroup extends J3w1Element { static readonly componentId: 'radio-group'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-radio-group': J3w1RadioGroup; } }
