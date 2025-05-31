import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findUserByEmailAndPassword(
      loginDto.email,
      loginDto.password,
    );

    const payload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('access_secret'),
      expiresIn: '1m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('refresh_secret'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('refresh_secret'),
      });

      const user = await this.usersService.findUserById(payload.id);

      const accessToken = this.jwtService.sign(
        {
          id: user.id,
          email: user.email,
        },
        {
          secret: this.configService.get('access_secret'),
          expiresIn: '1m',
        },
      );

      return {
        accessToken,
      };
    } catch (error) {
      console.log(error, 'error');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
