import { ConfigProps } from './config.interface';

export const config = (): ConfigProps => ({
  api_key: process.env.API_KEY,
  access_secret: process.env.ACCESS_SECRET_KEY,
  refresh_secret: process.env.REFRESH_SECRET_KEY,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});
