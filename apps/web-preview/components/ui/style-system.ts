export type Size = 'sm' | 'md' | 'lg';
export type State = 'default' | 'active' | 'disabled' | 'loading' | 'error' | 'success';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const asString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

export const asSize = (value: unknown, fallback: Size = 'md'): Size => {
  if (value === 'sm' || value === 'md' || value === 'lg') {
    return value;
  }
  return fallback;
};

export const asState = (value: unknown, fallback: State = 'default'): State => {
  if (
    value === 'default' ||
    value === 'active' ||
    value === 'disabled' ||
    value === 'loading' ||
    value === 'error' ||
    value === 'success'
  ) {
    return value;
  }
  return fallback;
};
