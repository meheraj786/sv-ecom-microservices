import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'inventory',
      protoPath: join(__dirname, '../../../shared/proto/inventory.proto'),
      url: '0.0.0.0:50054',
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost'],
      queue: 'inventory_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(
    `Inventory Hybrid Service active! HTTP port ${port}, gRPC port 50054 & RMQ active.`,
  );
}
bootstrap();
