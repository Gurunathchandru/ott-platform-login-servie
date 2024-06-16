import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { DBService } from 'src/external-entities/db.service';
import { Pool } from 'pg';
import { CustomerManageProfileDto } from './dto/customer-manage-profile.dto';
import { CustomerLoginDto } from './dto/customer-login-request.dto';
import { CustomerLoginResponseDto } from './dto/customer-login-response.dto';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RedisService } from 'src/external-entities/redis.service';
import * as Redis from 'redis';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CustomerModel } from 'src/models/customer.model';
import usersPgpConfig from 'src/config/pgp.config';

@Injectable()
export class CustomerService {
  pool: Pool;
  client: Redis.RedisClientType;
  constructor(
    @Inject(usersPgpConfig.KEY)
    private readonly pgpConf: ConfigType<typeof usersPgpConfig>,
    private readonly dbService: DBService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    // @Inject('USER-SERVICE') 
    // private readonly userService:ClientProxy
  ) {
    this.pool = dbService.pool;
    this.client = redisService.client;
  }

  async singUp(customerSignupDataDto: CustomerManageProfileDto): Promise<any> {
    console.log("customerdata", customerSignupDataDto)

    const rs = await CustomerModel.getFromEmail(
      customerSignupDataDto.email,
      this.pool,
      this.pgpConf,
      this.client
    );
    if (rs !== undefined) {
      throw new BadRequestException("user already exists");
    }

    const user = CustomerModel.build(customerSignupDataDto);

    const res = await user.save(this.pool, this.pgpConf, this.client).catch(error => {
      console.log(error)
      throw new InternalServerErrorException("error in saving the data")
    });
    return {
      message: "signup successful!"
    }
  }

  async getCustomers(customerId: string) {
    console.log("customerID", customerId);
    const res = await CustomerModel.getFromID(
      customerId,
      this.pool,
      this.pgpConf,
      this.client
    );
    console.log("res---->", res.password);
    return res;
  }

  async login(customerLoginDto: CustomerLoginDto) {
    const customer = await CustomerModel.getFromEmail(customerLoginDto.email,
      this.pool,
      this.pgpConf,
      this.client
    );
    console.log("inside login", customer);
    const password1 = customer.password;
    if (customer === undefined) {
      throw new BadRequestException('User not found');
    }
    if (customerLoginDto.password !== password1) {
      throw new BadRequestException('Invalid Password');
    }
    const responseUserObject = new CustomerLoginResponseDto(
      customer.customerName,
      customer.email,
      customer.phone
    );
    const payload = { customerId: customer.customerId, userType: "customer" };
    console.log(payload, "payload")
    const access_token1 = await this.jwtService.signAsync(payload);
    await this.client.set(customer.customerId.toString(), access_token1);
    const access_token = await this.client.get(customer.customerId.toString());
    console.log("access_token", access_token)
    return {
      message: 'Successfully logged in',
      name: customer.email,
      token: access_token,
      user: responseUserObject
    }
  }

  async resetPassword(data: ResetPasswordDto, req: Request) {
    const customerId = (req as any).user.result.customerId;
    let customer = await CustomerModel.getFromID(customerId,
      this.pool,
      this.pgpConf,
      this.client
    );
    if (data.password !== customer.password) {
      throw new BadRequestException("old password is wrong")
    }
    if (data.newPassword !== data.confirmPassword) {
      throw new BadRequestException("password doesnot match")
    }
    customer.password = data.newPassword;
    customer.save(this.pool, this.pgpConf, this.client);
    return customer.password;
  }

  async logout(req: Request) {
    console.log("entry")
    console.log("customer_id", (req as any).user.result.customerId);
    const del = await this.client.del((req as any).user.result.customerId);
    console.log("hai", del)
    return {
      message: "token is no longer valid!"
    }
  }
}




