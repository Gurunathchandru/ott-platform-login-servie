import * as jf from 'joiful';
import { v4  } from 'uuid';
import * as Pool from 'pg';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { RedisClientType } from 'redis';

export class WatchHistoryModel{
    constructor(){
        this.movieId = v4();
    }
@jf
.string()
.required()
movieId:string;

@jf
.string()
.required()
movieName:string;

@jf
.date()
.required()
watchDate:Date;

@jf
.number()
.required()
watchedContent:number;

@jf.string()
.required()
customerId: string;

@jf
.number()
.required()
enabled: number=1;

toJSON (data: boolean = false): any {
    const data1: any = {};
    for (const key in this) {
        if (!['movieId', 'customerId'].includes(key) || !data) {
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

public static build (rawData: any): WatchHistoryModel {
    const model = new WatchHistoryModel();

    if (rawData.watchhistory_info !== undefined) Object.assign(rawData, rawData.watchhistory_info);
    ['movieId', 'movieName','watchDate','watchedContent','customerId','enabled']
        .forEach((key) => {
            if (rawData[key] !== undefined && rawData[key] !== null) model[key] = rawData[key];  
        });
    model.validate();
    return model;
}

public async saveInDatabase (pool?: Pool): Promise<void> {
        if (pool !== undefined) {
            const watchHistoryInfo = this.toJSON(true);
            let rs= await pool.query(
                'SELECT watchhistory_info,movie_id FROM watch_history WHERE customer_id=$1 AND enabled= $2 AND movie_id = $3',
                [this.customerId,this.enabled,this.movieId]
            ).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException();
            });
            if (rs.rows[0] != null) {
                const [rawData] = rs.rows;
                Object.assign(rawData.watchhistory_info, watchHistoryInfo);
                rs = await pool.query(
                    'UPDATE  watch_history SET watchhistory_info=$2,' +
                    ' enabled=$3' +
                    ' WHERE customer_id=$1',
                    [this.customerId,watchHistoryInfo,this.enabled,]
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException();
                });
            } else {
                rs = await pool.query(
                    'INSERT INTO watch_history (movie_id,watchhistory_info,enabled)' +
                    ' VALUES ($1,$2,$3)',
                    [this.movieId, watchHistoryInfo, this.enabled]
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
            `watch-history:${this.customerId}`,
            JSON.stringify(this.toJSON())
        ).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
    }
}

public static async getFromId (
    customerId: string,
    pool?: Pool,
    pgp?: {
        publicKey: string,
        privateKey: string,
        privateKeyPassword: string
    },
    redisClient?: RedisClientType | undefined
): Promise<WatchHistoryModel | undefined> {
    if (redisClient !== undefined) {
        const cached = await redisClient.get(`watch-history:${customerId}`).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
        if (cached !== null) {
            return WatchHistoryModel.build(JSON.parse(cached));
        }
    }

    if (pool !== undefined && pgp !== undefined) {
        const rs= await pool.query(
            `SELECT movie_id,
             watchlist_info ,enabled,
            FROM watch_history WHERE customer_id=$1`,
            [customerId]
        ).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error);
        });
        if (rs.rows[0] !== undefined) {
            const [rawData] = rs.rows;
            const model = WatchHistoryModel.build(rawData);                           
            if (redisClient !== undefined) { await model.saveInRedis(redisClient); }
            return model;
        }           
    }
}

}