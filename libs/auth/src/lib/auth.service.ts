import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from './role.enum.js';

@Injectable()
export class AuthService {
  private readonly mockUser = {
    id: '1',
    email: 'admin@test.com',
    passwordHash: '$2b$10$VWfEqp3CdztLBWp1cHDdT.PMIqJxm7Q1h80wMkdc8tgnbPLaxJuta',
    role: Role.OWNER,
  };

  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, password: string) {
    if (email !== this.mockUser.email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      this.mockUser.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: this.mockUser.id,
      email: this.mockUser.email,
      role: this.mockUser.role,
    };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }
}
