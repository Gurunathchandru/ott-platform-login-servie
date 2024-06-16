import * as jf from 'joiful';
import { v4 } from 'uuid';
import * as Pool from 'pg';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { RedisClientType } from 'redis';

export class MovieModel{
    constructor(){
        this.movieId = v4();
    }
@jf
.string()
.required()
movieId:string

@jf
.string()
.required()
movieName:string;

@jf
.date()
.required()
releaseDate:Date;

@jf
.number()
.required()
rating:number;

@jf.string()
.required()
cast: string;

@jf.string()
.required()
language: string;

@jf.string()
.required()
genre: string;

@jf.string()
.required()
description: string;

@jf
.number()
.required()
enabled:number =1;

toJSON (data: boolean = false): any {
    const data1: any = {};
    for (const key in this) {
        if (!['movieId', 'enabled'].includes(key) || !data) {
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

public static build (rawData: any): MovieModel {
    const model = new MovieModel();
    if (rawData.movie_info !== undefined) Object.assign(rawData, rawData.movie_info);
    if (rawData.movieId !== undefined) model.movieId = rawData.movieId;
    else if  (rawData.movie_id !== undefined) model.movieId = rawData.movie_id;
    else model.movieId = v4();
    
    ['movieName','releaseDate','rating','cast','language','genre','description', 'enabled']
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
            const movieInfo = this.toJSON(true);
    
            let rs= await pool.query(
                'SELECT movieInfo FROM movie WHERE movie_id=$1 AND enabled= $2',
                [this.movieId,this.enabled]
            ).catch((error) => {
                console.log(error);
                throw new InternalServerErrorException();
            });
            if (rs.rows[0] != null) {
                const [rawData] = rs.rows;
                Object.assign(rawData.movie_info,movieInfo);
                rs = await pool.query(
                    'UPDATE movie SET movie_info=$2,' +
                    ' enabled=$3' +
                    ' WHERE movie_id=$1',
                    [this.movieId,movieInfo,this.enabled,]
                ).catch((error) => {
                    console.log(error);
                    throw new InternalServerErrorException();
                });
            } else {
                rs = await pool.query(
                    'INSERT INTO movie (movie_id,movie_info,enabled)' +
                    ' VALUES ($1,&2,$3)',
                    [this.movieId, movieInfo, this.enabled]
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
            `movie:${this.movieId}`,
            JSON.stringify(this.toJSON())
        ).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
    }
}

public static async getFromId (
    movieId: string,
    pool?: Pool,
    redisClient?: RedisClientType | undefined
): Promise<MovieModel | undefined> {
    if (redisClient !== undefined) {
        const cached = await redisClient.get(`movie:${movieId}`).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        });
        if (cached !== null) {
            return MovieModel.build(JSON.parse(cached));
        }
    if (pool !== undefined) {
        const rs= await pool.query(
            `SELECT movie_id,
             movie_info ,enabled
            FROM movie WHERE movie_id=$1`,
            [movieId]
        ).catch((error) => {
            console.log(error);
            throw new InternalServerErrorException(error);
        });
        if (rs.rows[0] !== undefined) {
            const [rawData] = rs.rows;
            const model = MovieModel.build(rawData);
            if (redisClient !== undefined) { await model.saveInRedis(redisClient); }
            return model;
        }
    }
}

}
}