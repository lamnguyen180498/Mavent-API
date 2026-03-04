import { TransformFnParams } from 'class-transformer';
import { SortOrder } from 'mongoose';

export function SortOrderTransform({
  value,
}: TransformFnParams): SortOrder | undefined {
  if (value === '1' || value === 1) return 1;
  if (value === '-1' || value === -1) return -1;

  const lowerValue = String(value).toLowerCase();
  return lowerValue === 'asc' || lowerValue === 'ascending'
    ? 1
    : lowerValue === 'desc' || lowerValue === 'descending'
    ? -1
    : undefined;
}
