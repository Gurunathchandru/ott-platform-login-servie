import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as jf from 'joiful';
import { v4 } from 'uuid';
import * as Pool from 'pg';
import { RedisClientType } from 'redis';


export class AdminModel{

    constructor(){
        this.adminId = v4();
    }

@jf
.string()
.required()
adminId:string ;

@jf
.string()
.email()
.required()
email:string;

@jf
.string()
.required()
adminName:string;

@jf
.string()
.required()
phone:string;

@jf
.string()
.required()
password:string;

@jf
.number()
.required()
enabled:number =1;

toJSON (data: boolean = false): any {
    const data1: any = {};
    for (const key in this) {
        if (!['adminId', 'enabled'].includes(key) || !data) {
            data1[key] = this[key];
        }
    }
    return data1; 
}

public validate (): void {
    for (const key in this) {
        if (this[key] === undefined || this[key] === null) delete this[key];
    }
    const valid = new jf.Validator({ abortEarly: false, allowUnknown: true }).validate(this); 
    if (valid.error != null) throw new BadRequestException(valid.error.message);
}

async save (
    pool?: Pool,
    redisClient?: RedisClientType | undefined 
): Promise<void> {
    this.validate();
    await this.saveInDatabase(pool);
    await this.saveInRedis(redisClient);
} 

public static build (rawData: any): AdminModel {
    const model = new AdminModel();
    if (rawData.personal_info !== undefined) Object.assign(rawData, rawData.personal_info);
    if (rawData.admiId !== undefined) model.adminId = rawData.adminId;
    else if  (rawData.admin_id !== undefined) model.adminId = rawData.admin_id;
    else model.adminId = v4();
    ['email', 'adminName','phone','password','enabled']
        .forEach((key) => {
            if (rawData[key] !== undefined && rawData[key] !== null) model[key] = rawData[key];
        });
    model.validate();
    return model;
}

public async saveInDatabase (pool?: Pool, pgp?:
    {
        publicKey: string,
        privateKey: string,
        privateKeyPassword: string
    }): Promise<void> {
        if (pool !== undefined) {
            if (pgp === undefined) throw new InternalServerErrorException('PGP Config is missing');
            const data = this.toJSON(true);
            const pInfo: any = {};
            ['email','adminName','phone','password'].map(key => {
                pInfo[key] = data[key];
                delete data[key];
            })
            let rs = await pool.query(
                'SELECT personal_info FROM admin WHERE admin_id=$1 AND enabled= $2',
                [this.adminId,this.enabled]
            ).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException();
            });
            if (rs.rows[0] != null) {
                const [rawData] = rs.rows;
                Object.assign(rawData.personal_info, pInfo);
                rs = await pool.query(
                    'UPDATE admin SET personal_info=PGP_PUB_ENCRYPT($2, DEARMOR($3)),' +
                    ' enabled=$4' +
                    ' WHERE admin_id=$1',
                    [this.adminId,pInfo,pgp.publicKey,
                          this.enabled,]
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException();
                });
            } else {
                rs = await pool.query(
                    'INSERT INTO admin (admin_id,personal_info,enabled)' +
                    ' VALUES ($1,PGP_PUB_ENCRYPT($2,DEARMOR($3)),$4)',
                    [this.adminId, pInfo, pgp.publicKey, this.enabled] 
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException();
                });
            }
        } else {
            console.log('admin save in DB: Pool client not initialized');
        }
    } 

public async saveInRedis (redisClient?: RedisClientType | undefined): Promise<void> {
    if (redisClient !== undefined) {
        await redisClient.set(
            `admin:${this.adminId}`,
            JSON.stringify(this.toJSON())
        ).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
        }
    }

public static async getFromId (
    adminId: string,
    pool?: Pool,
    pgp?: {
        publicKey: string,
        privateKey: string,
        privateKeyPassword: string
    },
    redisClient?: RedisClientType | undefined
    ): Promise<AdminModel | undefined> {
    if (redisClient !== undefined) {
        const cached = await redisClient.get(`admin:${adminId}`).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
        if (cached !== null) {
            return AdminModel.build(JSON.parse(cached));
        }
    }
    if (pool !== undefined && pgp !== undefined) {
        const rs = await pool.query(
            `SELECT
            PGP_PUB_DECRYPT(personal_info,DEARMOR(
                '${pgp.privateKey}'),
                '${pgp.privateKeyPassword}'
                ) AS pinfo ,enabled,
            FROM admin WHERE admin_id=$1`,
            [adminId]
        ).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error);
        });
        if (rs.rows[0] !== undefined) {
            const [rawData] = rs.rows;
            const model = AdminModel.build(rawData);
            if (redisClient !== undefined) { await model.saveInRedis(redisClient); }
            return model;
        }
    }
}

}










