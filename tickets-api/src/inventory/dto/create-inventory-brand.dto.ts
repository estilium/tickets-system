import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateInventoryBrandDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  appliesTo?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  order?: number;
}
