import { J3w1Element } from '../element.js';
export declare class J3w1Repeater extends J3w1Element { static readonly componentId: 'repeater'; static readonly version: '1.0.0';
  refresh(): void;
  focus(options?: FocusOptions): void;
  add(): string | null;
  remove(id: string): void;
  move(id: string, direction: number): void;
  readonly rowIds: string[];
}
declare global { interface HTMLElementTagNameMap { 'j3w1-repeater': J3w1Repeater; } }
