import { Module } from '@nestjs/common';
import { AuthModule } from '@org/auth';
import { AuthController } from './auth.controller';

@Module({
  imports: [AuthModule],
  controllers: [AuthController],
})
export class AuthApiModule {}
