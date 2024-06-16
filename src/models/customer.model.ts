import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as jf from 'joiful';
import { v4 } from 'uuid';
import * as Pool from 'pg';
import { RedisClientType } from 'redis';

export class CustomerModel {

    constructor() {
        this.customerId = v4();
    }
    @jf
        .string()
        .required()
    customerId: string;

    @jf
        .string()
        .email()
        .required()
    email: string;


    @jf
        .string()
        .required()
    customerName: string;


    @jf
        .string()
        .required()
    phone: string;


    @jf
        .string()
        .required()
    password: string;


    @jf
        .string()
        .required()
    languagePreference: string;

    @jf
        .string()
        .required()
    contentPreference: string;

    @jf
        .string()
        .required()
    country: string;

    @jf
        .date()
        .required()
    dateOfOnBoarding: Date;

    @jf
        .number()
        .required()
    enabled: number = 1;

    toJSON(data: boolean = false): any {
        const data1: any = {};
        for (const key in this) {
            if (!['customerId', 'enabled'].includes(key) || !data) {
                data1[key] = this[key];
            }
        }
        return data1;
    }

    public validate(): void {
        for (const key in this) {
            if (this[key] === undefined || this[key] === null) delete this[key];
        }
        const valid = new jf.Validator({ abortEarly: false, allowUnknown: true }).validate(this);
        if (valid.error != null) throw new BadRequestException(valid.error.message, "error in validation");
    }

    async save(
        pool?: Pool,
        pgp?: {
            publicKey: string,
            privateKey: string,
            privateKeyPassword: string
        },
        redisClient?: RedisClientType | undefined
    ): Promise<void> {
        this.validate();
        const shouldAddEmail = await this.saveInDatabase(pool, pgp);
        await this.saveInRedis(redisClient, shouldAddEmail);
    }

    public static build(rawData: any): CustomerModel {
        const model = new CustomerModel();
        if (rawData.data !== undefined) Object.assign(rawData, rawData.data);
        if (rawData.customerId !== undefined) model.customerId = rawData.customerId;
        else if (rawData.customer_id !== undefined) model.customerId = rawData.customer_id;
        else model.customerId = v4();
        ['customerId', 'email', 'customerName', 'phone', 'password', 'languagePreference',
            'contentPreference', 'country', 'dateOfOnBoarding', 'enabled']
            .forEach((key) => {
                if (rawData[key] !== undefined && rawData[key] !== null) model[key] = rawData[key];
            });
        model.validate();
        console.log("data returned from modell")
        return model;
    }

    public async saveInDatabase(pool?: Pool, pgp?:
        {
            publicKey: string,
            privateKey: string,
            privateKeyPassword: string
        }): Promise<boolean> {
        if (pool !== undefined) {
            if (pgp === undefined) throw new InternalServerErrorException('PGP Config is missing');
            const data = this.toJSON(true);
            const pInfo: any = {};
            ['email', 'customerName', 'phone'].forEach((key) => {
                pInfo[key] = data[key];
                delete data[key];
            })
            let rs = await pool.query(
                'SELECT personal_info,other_info FROM customer WHERE customer_id=$1 AND enabled= $2',
                [this.customerId, this.enabled]
            ).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException();
            });
            if (rs.rows[0] != null) {
                const [rawData] = rs.rows;
                Object.assign(rawData.personal_info, pInfo);
                rs = await pool.query(
                    'UPDATE customer SET personal_info=PGP_PUB_ENCRYPT($2, DEARMOR($3)),other_info=$4,enabled =$5' +
                    ' WHERE customer_id=$1',
                    [this.customerId, pInfo, pgp.publicKey, data,
                    this.enabled]
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException();
                });
                return false
            } else {
                rs = await pool.query(
                    'INSERT INTO customer (customer_id,personal_info,other_info,enabled)' +
                    ' VALUES ($1,PGP_PUB_ENCRYPT($2,DEARMOR($3)),$4,$5)',
                    [this.customerId, pInfo, pgp.publicKey, data, this.enabled]
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException();
                });
                return true;
            }
        } else {
            console.log('admin save in DB: Pool client not initialized');
            return false
        }
    }
    public async saveInRedis(
        redisClient?: RedisClientType | undefined,
        shouldAddEmail: boolean = false): Promise<void> {
        if (redisClient !== undefined) {
            await redisClient.set(
                `customer:${this.customerId}`,
                JSON.stringify(this.toJSON())
            ).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException(error.message);
            });
            if (shouldAddEmail) {
                await redisClient.set(
                    `customer_email:${this.email}`,
                    this.customerId
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException(error.message);
                });

                const customerId = await redisClient.get(`customer_email:${this.email}`).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException(error.message);
                });
                console.log("customerId from redis ", customerId)
            }
        }
    }

    public static async getFromID(
        customerId: string,
        pool?: Pool,
        pgp?: {
            publicKey: string,
            privateKey: string,
            privateKeyPassword: string
        },
        redisClient?: RedisClientType | undefined
    ): Promise<CustomerModel | undefined> {
        if (redisClient !== undefined) {
            const cached = await redisClient.get(`customer:${customerId}`).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException(error.message);
            });
            if (cached !== null) {
                return CustomerModel.build(JSON.parse(cached));
            }
        }
        if (pool !== undefined && pgp !== undefined) {
            console.log("inside fetch")
            console.log(customerId);
            console.log(pgp.privateKey);
            console.log(pgp.privateKeyPassword)
            const rs = await pool.query(
                `SELECT customer_id,personal_info,personal_info(personal_info,DEARMOR($2),$3) AS personal_info FROM customer WHERE customer_id = $1`,
                [customerId, pgp.privateKey, pgp.privateKeyPassword]
            ).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException(error, "errror in getting data");
            });
            console.log(rs.rows[0])
            if (rs.rows[0] !== undefined) {
                const [rawData] = rs.rows;
                rawData.data = { ...rawData.other_info, ...JSON.parse(rawData.personal_info) };
                console.log("rawdata from the getfromId")
                const model = CustomerModel.build(rawData);
                if (redisClient !== undefined) { await model.saveInRedis(redisClient); }
                return model;
            }
        }
    }

    static async getFromEmail(email: string,
        pool: Pool,
        pgp: {
            publicKey: string,
            privateKey: string,
            privateKeyPassword: string
        },
        redisClient: RedisClientType
    ) {
        const customerId = await redisClient.get(`customer_email:${email}`).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
        console.log("customerId ", customerId)
        if (customerId !== null) {
            return CustomerModel.getFromID(customerId, pool, pgp, redisClient);
        }
    }
}










