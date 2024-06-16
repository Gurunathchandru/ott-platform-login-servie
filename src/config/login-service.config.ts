import { registerAs } from "@nestjs/config";
import { Transport } from "@nestjs/microservices";

export default registerAs('loginServiceConfig', () => ({
  transport: Transport.TCP,
  options: {
    host: process.env.LOGIN_MICROSERVICE_HOST ?? 'localhost',
    port: parseInt(process.env.LOGIN_MICROSERVICE_PORT ?? '3003')
  }
}));


