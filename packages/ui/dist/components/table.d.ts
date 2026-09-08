import { J3w1Element } from '../element.js';
export declare class J3w1Table extends J3w1Element { static readonly componentId: 'table'; static readonly version: '1.1.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  sort(column: number, direction?: 'ascending' | 'descending'): void;
  filter(query: string): void;
}
declare global { interface HTMLElementTagNameMap { 'j3w1-table': J3w1Table; } }
