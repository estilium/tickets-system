import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateItemDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
