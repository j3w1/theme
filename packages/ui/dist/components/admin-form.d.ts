import { J3w1Element } from '../element.js';
export declare class J3w1AdminForm extends J3w1Element { static readonly componentId: 'admin-form'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-admin-form': J3w1AdminForm; } }
