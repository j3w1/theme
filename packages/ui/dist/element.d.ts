export declare class J3w1Element extends HTMLElement {
  readonly control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement | HTMLProgressElement | null;
  readonly controls: Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>;
  value: string;
  checked: boolean;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  name: string;
  readonly form: HTMLFormElement | null;
  checkValidity(): boolean;
  reportValidity(): boolean;
  focus(options?: FocusOptions): void;
  refresh(): void;
  emit(type: string, detail?: Record<string, unknown>): boolean;
}
