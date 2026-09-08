import { J3w1Element } from '../element.js';
export declare class J3w1IconButton extends J3w1Element { static readonly componentId: 'icon-button'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-icon-button': J3w1IconButton; } }
