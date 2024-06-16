import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { DBService } from 'src/external-entities/db.service';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
// import { CustomerMiddleware } from './middleware/customer.middleware';
import { RedisService } from 'src/external-entities/redis.service';
import { RolesGuard } from '../guards/role.guards';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CustomerModel } from 'src/models/customer.model';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: "secret",
      signOptions: { expiresIn: '3600s' },
    }),
  ],
  providers: [CustomerService,DBService,ConfigService,CustomerModel,RedisService,RolesGuard,
    // {
      // provide: 'USER-SERVICE',
      // useFactory: (configService: ConfigService) =>
      //   ClientProxyFactory.create(
      //     configService.get('userServiceConfig') ?? { 
      //       transport: Transport.TCP,
      //       options: {
      //         host: 'localhost',
      //         port: 4003,
      //       },
      //     },
      //   ),
      // inject: [ConfigService], 
    // }
  ],
  controllers: [CustomerController]
})
export class CustomerModule {}