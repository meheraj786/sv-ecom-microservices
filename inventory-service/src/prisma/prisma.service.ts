import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL || process.env.INVENTORY_SERVICE_DB_URL;

    if (!connectionString) {
      throw new Error('Missing DATABASE_URL for inventory service');
    }

    const pool = new Pool({
      connectionString,
    });

    const adapter = new PrismaPg(pool, {
      schema: 'inventory_schema',
    });

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Inventory database connected to inventory_schema');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Inventory database disconnected');
  }
}
