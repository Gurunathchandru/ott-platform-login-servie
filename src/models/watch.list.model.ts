import * as jf from 'joiful';
import { v4} from 'uuid';
import * as Pool from 'pg';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { RedisClientType } from 'redis';

export class WatchListModel{
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
addedDate:Date;

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

public static build (rawData: any): WatchListModel {
    const model = new WatchListModel();
    if (rawData.watchlist_info !== undefined) Object.assign(rawData, rawData.watchlist_info);

    ['movieId','movieName','addedDate','customerId','enabled']
        .forEach((key) => {
            if (rawData[key] !== undefined && rawData[key] !== null) model[key] = rawData[key];
        });
    model.validate();
    return model;
}

public async saveInDatabase (pool?: Pool): Promise<void> {
        if (pool !== undefined) {
            const watchListInfo = this.toJSON(true);
            
            let rs= await pool.query(
                'SELECT watchlist_info FROM watch_list WHERE customer_id=$1 AND enabled= $2 AND movie_id = $3',
                [this.customerId,this.enabled,this.movieId]
            ).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException();
            });
            if (rs.rows[0] != null) {
                const [rawData] = rs.rows;
                Object.assign(rawData.watchlist_info, watchListInfo);
                rs = await pool.query(
                    'UPDATE  watch_list SET watchlist_info,' +
                    ' enabled=$4' +
                    ' WHERE customer_id=$1',
                    [this.customerId,watchListInfo,this.enabled,]
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException();
                });
            } else {
                rs = await pool.query(
                    'INSERT INTO watch_list (movie_id,watchlist_info,enabled)' +
                    ' VALUES ($1,$2,$3)',
                    [this.movieId, watchListInfo, this.enabled]
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
            `watch-list:${this.customerId}`,
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
): Promise<WatchListModel | undefined> {
    if (redisClient !== undefined) {
        const cached = await redisClient.get(`watch-list:${customerId}`).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
        if (cached !== null) {
            return WatchListModel.build(JSON.parse(cached));
        }
    }
     if (pool !== undefined && pgp !== undefined) {
        const rs= await pool.query(
            `SELECT movie_id
            watchlist_info ,enabled,
            FROM movie WHERE customer_id=$1`,
            [customerId]
        ).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error);
        });
        if (rs.rows[0] !== undefined) {
            const [rawData] = rs.rows;                    
            const model = WatchListModel.build(rawData);
            if (redisClient !== undefined) { await model.saveInRedis(redisClient); }
            return model;
        }
    }
}

}