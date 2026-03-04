import { TransformFnParams } from 'class-transformer';
export function BooleanTransform({ value }: TransformFnParams): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value.toLowerCase() === 'on';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
}
