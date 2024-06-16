import { registerAs } from "@nestjs/config";
import { Transport } from "@nestjs/microservices";

export default registerAs('userServiceConfig', () => ({
  transport: Transport.TCP,
  options: {
    host: process.env.USER_MICROSERVICE_HOST ?? 'localhost',
    port: parseInt(process.env.USER_MICROSERVICE_PORT ?? '4003')
  } 
}));
