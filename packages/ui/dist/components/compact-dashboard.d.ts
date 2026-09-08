import { J3w1Element } from '../element.js';
export declare class J3w1CompactDashboard extends J3w1Element { static readonly componentId: 'compact-dashboard'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-compact-dashboard': J3w1CompactDashboard; } }
