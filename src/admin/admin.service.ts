import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AdminDataDto } from './dto/admin.dto';
import { Pool } from 'pg';
import { RedisService } from 'src/external-entities/redis.service';
import * as Redis from 'redis';
import { DBService } from 'src/external-entities/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminModel } from 'src/models/admin.model';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';



@Injectable()
export class AdminService {

    pool:Pool;
    client: Redis.RedisClientType;
 constructor(private readonly dbService:DBService,
            private readonly jwtService: JwtService,
            private readonly adminModel:AdminModel,
            private readonly redisService:RedisService,
            private readonly configService:ConfigService)
            {
              this.pool = dbService.pool;
              this.client = redisService.client;    
            }

    async addAdmin(adminDataDto: AdminDataDto):Promise<any> {
        const user = await AdminModel.build(adminDataDto)
        const res = await user.save(this.pool,this.client)
        .catch(error => {
          console.log(error)
          throw new InternalServerErrorException("error in saving the data")
        });
        return{
          message:"signup successful!"
        } 
    }

    async getCustomers(email:string){
        return await AdminModel.getFromId(
          email,
          this.pool,
        );
    }

//     async login(adminLoginDto:AdminLoginDto) { 
//         const result = await AdminModel.getFromId(adminLoginDto.email,this.pool);
//         // console.log(result);
//         const password1 = result.personal_info.password;
//         console.log("password",password1)
//         if(result.personal_info.length === 0) { 
//             throw new BadRequestException('User not found');  
//           }
//           console.log( adminLoginDto.password)
//         if (adminLoginDto.password !== password1) { 
//             throw new BadRequestException('Invalid Password');
//         }
//         const responseUserObject = new AdminLoginResponseDto(
//                 result.personal_info.custoemr_id,
//                 result.personal_info.fullName, 
//                 result.personal_info.email,
//                 result.personal_info.phone 
//                 );
//         const payload = {email: adminLoginDto.email,userType:adminLoginDto.userType};
//         const access_token1 =  await this.jwtService.signAsync(payload);
//           await this.client.set(adminLoginDto.email.toString(),access_token1 );
//           const access_token = await this.client.get(adminLoginDto.email.toString());
//           console.log("access_token",access_token)
//         return {  
//             message: 'Successfully logged in',
//             name : result.personal_info.email, 
//             token : access_token,
//             user: responseUserObject 
//         }  
//       }
}
