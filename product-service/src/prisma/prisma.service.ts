import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import pg from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public write: PrismaClient;
  public read: PrismaClient;

  private writePool: pg.Pool;
  private readPool: pg.Pool;

  private buildConnectionString(raw?: string, fallback?: string): string {
    const connectionString = raw ?? fallback;

    if (!connectionString) {
      throw new Error(
        'Missing PostgreSQL connection string for product service.',
      );
    }

    if (connectionString.includes('schema=')) {
      return connectionString;
    }

    const separator = connectionString.includes('?') ? '&' : '?';
    return `${connectionString}${separator}schema=product_schema`;
  }

  constructor() {
    const writeConnectionString = this.buildConnectionString(
      process.env.DATABASE_URL,
      process.env.PRODUCT_SERVICE_WRITE_DB_URL,
    );
    const readConnectionString = this.buildConnectionString(
      process.env.REPLICA_DATABASE_URL,
      process.env.PRODUCT_SERVICE_READ_DB_URL ?? writeConnectionString,
    );

    // 1. Setup Master/Write Connection (product_write_db)
    this.writePool = new pg.Pool({
      connectionString: writeConnectionString,
    });
    // Explicitly pass isolated 'product_schema'
    const writeAdapter = new PrismaPg(this.writePool, {
      schema: 'product_schema',
    });
    this.write = new PrismaClient({ adapter: writeAdapter });

    // 2. Setup Replica/Read Connection (product_read_db)
    this.readPool = new pg.Pool({
      connectionString: readConnectionString,
    });
    const readAdapter = new PrismaPg(this.readPool, {
      schema: 'product_schema',
    });
    this.read = new PrismaClient({ adapter: readAdapter });
  }

  async onModuleInit() {
    console.log(
      'Product Service Database Master and Replica pools initialized with Prisma 7 adapters.',
    );
  }

  async onModuleDestroy() {
    // Gracefully shutdown both PG connection pools
    await this.writePool.end();
    await this.readPool.end();
  }
}
