import { J3w1Element } from '../element.js';
export declare class J3w1DescriptionList extends J3w1Element { static readonly componentId: 'description-list'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-description-list': J3w1DescriptionList; } }
