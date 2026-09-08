import { J3w1Element } from '../element.js';
export declare class J3w1SidebarNav extends J3w1Element { static readonly componentId: 'sidebar-nav'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  open: boolean;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-sidebar-nav': J3w1SidebarNav; } }
