import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleInit() {
    this.client.on('connect', () => {
      console.log('Successfully connected to Upstash Redis Cache.');
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
