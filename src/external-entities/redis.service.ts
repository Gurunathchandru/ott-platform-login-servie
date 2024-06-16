import { Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { RedisClientType, createClient } from "redis";
import redisConfig from "src/config/redis.config";

export class RedisService {
    client: RedisClientType
    constructor(
        @Inject(redisConfig.KEY)
        private readonly redisConf: ConfigType<typeof redisConfig>
    ) {
        this.initiateRedisClient()
    }
    initiateRedisClient() {
        const redis: RedisClientType = createClient(this.redisConf);
        this.client = redis;
        this.client.connect();
    }
}