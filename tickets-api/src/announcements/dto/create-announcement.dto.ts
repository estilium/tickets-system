import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(5)
  body: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
