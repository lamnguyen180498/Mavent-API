import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PageDto } from '../dto/page.dto';

export const ApiPaginationResponse = (model: any) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: {
                  allOf: [
                    { $ref: getSchemaPath(model) },
                    {
                      properties: {
                        _id: {
                          type: 'string',
                        },
                        created_at: {
                          type: 'string',
                          nullable: false,
                        },
                        updated_at: {
                          type: 'string',
                          nullable: false,
                        },
                        deleted_at: {
                          type: 'string',
                          nullable: true,
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    }),
  );
};
