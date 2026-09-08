import { J3w1Element } from '../element.js';
export declare class J3w1Switch extends J3w1Element { static readonly componentId: 'switch'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  checked: boolean;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-switch': J3w1Switch; } }
