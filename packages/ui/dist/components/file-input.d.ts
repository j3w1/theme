import { J3w1Element } from '../element.js';
export declare class J3w1FileInput extends J3w1Element { static readonly componentId: 'file-input'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  clear(): void;
  readonly files: File[];
}
declare global { interface HTMLElementTagNameMap { 'j3w1-file-input': J3w1FileInput; } }
