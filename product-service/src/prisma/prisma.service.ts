import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public write: PrismaClient;
  public read: PrismaClient;

  private writePool: pg.Pool;
  private readPool: pg.Pool;

  constructor() {
    // 1. Setup Master/Write Connection (product_write_db)
    this.writePool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    // Explicitly pass isolated 'product_schema'
    const writeAdapter = new PrismaPg(this.writePool, {
      schema: 'product_schema',
    });
    this.write = new PrismaClient({ adapter: writeAdapter });

    // 2. Setup Replica/Read Connection (product_read_db)
    this.readPool = new pg.Pool({
      connectionString: process.env.REPLICA_DATABASE_URL,
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
