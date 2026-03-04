export const pipePagination = (page = 1, limit = 10) => {
  return [
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        meta: [
          {
            $count: 'itemCount',
          },
          {
            $addFields: {
              page,
              take: limit,
              pageCount: {
                $ceil: {
                  $divide: ['$itemCount', limit],
                },
              },
              hasPreviousPage: {
                $cond: [{ $gt: [page, 1] }, true, false],
              },
              hasNextPage: {
                $cond: [
                  {
                    $lt: [page, { $ceil: { $divide: ['$itemCount', limit] } }],
                  },
                  true,
                  false,
                ],
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        data: 1,
        meta: {
          $ifNull: [
            { $arrayElemAt: ['$meta', 0] },
            {
              itemCount: 0,
              page,
              take: limit,
              pageCount: 1,
              hasPreviousPage: false,
              hasNextPage: false,
            },
          ],
        },
      },
    },
  ];
};
