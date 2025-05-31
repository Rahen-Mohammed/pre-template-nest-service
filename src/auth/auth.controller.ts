import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @ApiHeader({
    name: 'Refresh-Token',
    description: 'Bearer ${token}',
    required: true,
  })
  @Post('refresh-token')
  refreshToken(@Headers('Refresh-Token') refreshToken: string) {
    const token = refreshToken?.split(' ')?.[1];
    return this.authService.refreshToken(token);
  }
}
