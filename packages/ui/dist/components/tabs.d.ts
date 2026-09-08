import { J3w1Element } from '../element.js';
export declare class J3w1Tabs extends J3w1Element { static readonly componentId: 'tabs'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  select(id: string, focus?: boolean): HTMLElement;
  selectedId: string;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-tabs': J3w1Tabs; } }
