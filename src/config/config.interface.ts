export interface ConfigProps {
  api_key: string;
  refresh_secret: string;
  access_secret: string;
  database: {
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
  };
}
