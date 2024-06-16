import { Pool } from 'pg';
import { Inject, Injectable } from '@nestjs/common';
import {  ConfigType } from '@nestjs/config';
import pgConfig from 'src/config/pg.config';

@Injectable()
export class DBService {
    pool: Pool;

    constructor(
        @Inject(pgConfig.KEY)
        private readonly dbConf: ConfigType<typeof pgConfig>
    ) {
        this.initialisePoolClient();
    }

    private initialisePoolClient() {
        this.pool = new Pool(this.dbConf);
    }
}
