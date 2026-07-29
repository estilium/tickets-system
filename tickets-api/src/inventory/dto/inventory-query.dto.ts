import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssetStatus, AssetType } from '@prisma/client';

export class InventoryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsString()
  department?: string;
}
