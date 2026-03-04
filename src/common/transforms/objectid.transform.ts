import { TransformFnParams } from 'class-transformer';
import { Types } from 'mongoose';

export function ObjectIdTransform({
  value,
}: TransformFnParams): Types.ObjectId | undefined {
  return Types.ObjectId.isValid(value)
    ? typeof value === 'string'
      ? new Types.ObjectId(value)
      : value
    : typeof value === 'number'
    ? Types.ObjectId.createFromTime(value)
    : undefined;
}
