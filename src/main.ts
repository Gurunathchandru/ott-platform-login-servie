import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule,DocumentBuilder } from '@nestjs/swagger';

import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService)
  // const loginServiceConfig = configService.get('loginServiceConfig')

  
  app.useGlobalPipes(new ValidationPipe({ 
    skipMissingProperties: true,
    transform: true,
    whitelist: true
  }));

  const config = new DocumentBuilder()
  .setTitle('Nest API')
  .setDescription('the description of the API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
  const document = SwaggerModule.createDocument(app,config);  
  SwaggerModule.setup('/',app,document);  

  // if ((parseInt(loginServiceConfig.loginServicePort) !== 0)) {
  //   app.connectMicroservice<MicroserviceOptions>(     
  //     {
  //       transport: Transport.TCP,
  //       options: { port: parseInt(loginServiceConfig.loginServicePort), host: '0.0.0.0' } 
  //     },     
  //   );
  //   await app.startAllMicroservices();
  // }
  await app.listen(3001);
}
bootstrap();
