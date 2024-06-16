import { Injectable } from "@nestjs/common";
import { registerAs } from "@nestjs/config";


export default registerAs('pgConfig', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? ''),
  user: process.env.DBTABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}));
