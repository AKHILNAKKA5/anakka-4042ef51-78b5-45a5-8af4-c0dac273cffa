import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule, AuthService } from '@org/auth';
import { AuthController } from './auth.controller';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [AuthController],
})
export class AuthApiModule implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService
  ) {}

  onModuleInit() {
    this.authService.setUserRepository(this.userRepository);
  }
}
