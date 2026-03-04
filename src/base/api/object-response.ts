import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { isArray } from 'lodash';
import { defaultProperties, recursiveSchemaLoop } from './core-response';

export const ApiObjectResponse = (
  model: any,
  populates?: { [key: string]: any },
) => {
  const result = {};
  const models = [model];
  Object.keys(populates).forEach((k) => {
    result[k] = recursiveSchemaLoop(populates[k]);
    isArray(populates[k])
      ? models.push(...populates[k])
      : models.push(populates[k]);
  });

  return applyDecorators(
    ApiExtraModels(...models),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(model) },
          {
            type: 'object',
            properties: {
              ...defaultProperties,
              ...result,
            },
          },
        ],
      },
    }),
  );
};
