import { ApiExtraModels, ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiFilterQuery(fieldName: string, filterDto: any) {
  return applyDecorators(
    ApiExtraModels(filterDto),
    ApiQuery({
      required: false,
      name: fieldName,
      style: 'deepObject',
      explode: true,
      type: 'object',
      schema: {
        $ref: getSchemaPath(filterDto),
      },
    }),
  );
}
