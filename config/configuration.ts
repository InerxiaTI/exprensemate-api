import { LogLevel } from '@nestjs/common/services/logger.service';

const LOGGER_LEVEL: LogLevel = typeof process.env.LOGGER_LEVEL as LogLevel;

export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10),
    logger: [LOGGER_LEVEL],
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dbname: process.env.DB_NAME,
  },
});
