import { TransformFnParams } from 'class-transformer';
import { Types } from 'mongoose';

export function ObjectIdArrayTransform({
  value,
}: TransformFnParams): Types.ObjectId[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        Types.ObjectId.isValid(item)
          ? typeof item === 'string'
            ? new Types.ObjectId(item)
            : item
          : typeof item === 'number'
          ? Types.ObjectId.createFromTime(item)
          : undefined,
      )
      .filter((item) => item !== undefined);
  }
  return undefined;
}
