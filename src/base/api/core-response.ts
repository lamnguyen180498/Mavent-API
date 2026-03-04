import { isArray } from 'lodash';
import { getSchemaPath } from '@nestjs/swagger';

export const defaultProperties = {
  _id: {
    type: 'string',
  },
  created_at: {
    type: 'string',
  },
  updated_at: {
    type: 'string',
  },
  delete_at: {
    type: 'string',
    nullable: true,
  },
};

export const recursiveSchemaLoop = (model: string | string[]) => {
  if (isArray(model)) {
    return {
      type: 'array',
      items: recursiveSchemaLoop(model[0]),
    };
  }

  return {
    allOf: [
      { $ref: getSchemaPath(model) },
      {
        type: 'object',
        properties: {
          ...defaultProperties,
        },
      },
    ],
  };
};
