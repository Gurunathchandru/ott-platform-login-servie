import { Module } from '@nestjs/common';
import { AdminModel } from 'src/models/admin.model';
import { AdminService } from './admin.service';
import { DBService } from 'src/external-entities/db.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/external-entities/redis.service';
import { AdminController } from './admin.controller';

@Module({
    imports: [
    //   JwtModule.register({
    //     global: true,
    //     secret: "secret",
    //     signOptions: { expiresIn: '3600s' },
    //   }),
    ],
    providers: [AdminService,DBService,ConfigService,AdminModel,RedisService],
    controllers: [AdminController]
  })
  export class AdminModule {}
  