import { J3w1Element } from '../element.js';
export declare class J3w1Breadcrumbs extends J3w1Element { static readonly componentId: 'breadcrumbs'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-breadcrumbs': J3w1Breadcrumbs; } }
