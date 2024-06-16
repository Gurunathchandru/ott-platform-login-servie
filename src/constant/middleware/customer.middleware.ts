import { BadRequestException, Inject, Injectable, InternalServerErrorException, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DBService } from 'src/external-entities/db.service';
import { Pool } from 'pg';
import { JwtService } from '@nestjs/jwt';
import { CustomerModel } from 'src/models/customer.model';
import { ConfigService, ConfigType } from '@nestjs/config';
import { RedisService } from 'src/external-entities/redis.service';
import * as Redis from 'redis';
import usersPgpConfig from 'src/config/pgp.config';

@Injectable()
export class CustomerMiddleware implements NestMiddleware {
  pool: Pool;
  client: Redis.RedisClientType;
  constructor(
    @Inject(usersPgpConfig.KEY)
    private readonly pgpConf: ConfigType<typeof usersPgpConfig>,
    private readonly jwtService: JwtService,
    private readonly dbservice: DBService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,) {
    this.pool = dbservice.pool;
    this.client = redisService.client;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.split(' ')?.[1];
    console.log("token", token)
    if (token === undefined) {
      next();
      return;
    }
    console.log("middle ware")
    let user = await this.verifyUser(token);
    if (user) {
      (req as any).user = user;
      console.log((req as any).user.result.email, "req")
      next();
    }

  }
  async verifyUser(token) {
    let decodedToken;
    decodedToken = this.jwtService.verify(token);
    const result = await CustomerModel.getFromID(decodedToken.customerId,
      this.pool,
      this.pgpConf,
      this.client)
      .catch(error => {
        console.log(error);
        throw new InternalServerErrorException("error in getting customer data from payload");
      });
    const isToken = await this.client.get(String(decodedToken.customerID));
    console.log("isToken", isToken)
    if (isToken === null) {
      console.log("login again");
      return { message: "login again" };
    }
    let loginType = "customer";
    return { result, loginType };
  }
}



