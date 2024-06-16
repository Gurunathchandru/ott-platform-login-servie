import { registerAs } from '@nestjs/config';

export default registerAs('pgConfig', () => {
  const database = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    name: process.env.DATABASE_NAME || 'login-service',
    user: process.env.DATABASE_USER || 'gurunathc',
    password: process.env.DATABASE_PASSWORD || 'Guru@123',
  };
  console.log(database.name,"hai");
  return {
    database: database,
  }; 
});
