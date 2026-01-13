import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface UserRepository {
  findOne(options: { where: { email: string }; relations?: string[] }): Promise<any>;
}

@Injectable()
export class AuthService {
  private userRepository: UserRepository | null = null;

  constructor(private readonly jwtService: JwtService) {}

  setUserRepository(repository: UserRepository) {
    this.userRepository = repository;
  }

  async login(email: string, password: string) {
    if (!this.userRepository) {
      throw new UnauthorizedException('Authentication service not properly configured');
    }

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }
}
