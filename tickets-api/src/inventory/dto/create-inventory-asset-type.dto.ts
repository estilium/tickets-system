import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min, MaxLength } from 'class-validator';
import { AssetType } from '@prisma/client';

export class CreateInventoryAssetTypeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  @MaxLength(3)
  @Matches(/^[A-Za-z0-9]{1,3}$/)
  labelPrefix: string;

  @IsOptional()
  @IsEnum(AssetType)
  baseType?: AssetType;

  @IsOptional()
  @IsString()
  baseCategoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  criteria?: string[];

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
