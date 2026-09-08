import { J3w1Element } from '../element.js';
export declare class J3w1Avatar extends J3w1Element { static readonly componentId: 'avatar'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  src: string;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-avatar': J3w1Avatar; } }
