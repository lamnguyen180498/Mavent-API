import * as process from 'process';

export default () => ({
  database: {
    mysql: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    mongo: {
      uri: process.env.MONGODB_URI,
    },
    bull: {
      redis: {
        port: +process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST || '127.0.0.1',
        db: +process.env.REDIS_DB || 0,
        password: process.env.REDIS_PASSWORD,
      },
      prefix: process.env.REDIS_PREFIX || '',
    },
    bullmq: {
      connection: {
        port: +process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST || '127.0.0.1',
        db: +process.env.REDIS_DB || 0,
        password: process.env.REDIS_PASSWORD,
        prefix: process.env.REDIS_PREFIX || '',
      },
    },
    cache: {
      connect: {
        database: +process.env.REDIS_DB || 0,
        password: process.env.REDIS_PASSWORD,
        socket: {
          port: +process.env.REDIS_PORT || 6379,
          host: process.env.REDIS_HOST || '127.0.0.1',
        },
      },
      options: {
        namespace: process.env.CACHE_NAMESPACE,
      },
    },
  },
});
