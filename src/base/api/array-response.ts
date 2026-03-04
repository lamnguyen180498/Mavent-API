import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { defaultProperties, recursiveSchemaLoop } from './core-response';
import { isArray, isEmpty } from 'lodash';

export const ApiArrayResponse = (
  model: any,
  populates?: { [key: string]: any },
) => {
  const result = {};
  const models = [model];
  if (!isEmpty(populates))
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
        type: 'array',
        items: {
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
      },
    }),
  );
};
