import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { DBService } from './external-entities/db.service';
import { CustomerModule } from './customer/customer.module';
import { APP_GUARD } from '@nestjs/core';
import { CustomerMiddleware } from './constant/middleware/customer.middleware';
import pgConfig from 'src/config/pg.config'
import usersPgpConfig from 'src/config/pgp.config'
import { RedisService } from './external-entities/redis.service';
import loginServiceConfig from './config/login-service.config';
import userServiceConfig from './config/user-service.config';
import { RolesGuard } from './guards/role.guards';
import redisConfig from './config/redis.config';

@Module({
  imports: [AdminModule,
    ConfigModule.forRoot({
      envFilePath: '/Users/gurunathc/Documents/login-service/.env.Develop',
      isGlobal: true,
      load: [pgConfig, redisConfig, usersPgpConfig, loginServiceConfig, userServiceConfig],
      cache: true,
    }),
    CustomerModule,
    AdminModule
  ],
  controllers: [AppController],
  providers: [AppService,
    DBService,
    RedisService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})

export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CustomerMiddleware).forRoutes('customer')
  }
}