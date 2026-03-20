import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {

  @ApiProperty({
    example: 'user@company.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'MySecurePassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}