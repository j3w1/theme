import { J3w1Element } from '../element.js';
export declare class J3w1FilterableTable extends J3w1Element { static readonly componentId: 'filterable-table'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  sort(column: number, direction?: 'ascending' | 'descending'): void;
  filter(query: string): void;
  selectedIds: string[];
}
declare global { interface HTMLElementTagNameMap { 'j3w1-filterable-table': J3w1FilterableTable; } }
