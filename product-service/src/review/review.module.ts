import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY || 'fallback_secret',
    }),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
