import { Injectable } from "@nestjs/common";
import { registerAs } from "@nestjs/config";


export default registerAs('redisConfig', () => ({
  url: `redis://${getAuthDetails()}${getHostDetails()}`
}));

function getAuthDetails() {
  return process.env.REDIS_PASSWORD || process.env.REDIS_USERNAME
    ? `${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@`
    : ''
}

function getHostDetails() {
  return `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
}
