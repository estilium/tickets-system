import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AssetCondition, AssetStatus, AssetType } from '@prisma/client';

export class CreateInventoryAssetDto {
  @IsOptional()
  @IsString()
  assetTag?: string;

  @IsOptional()
  @IsString()
  assetTypeId?: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  assignedEmail?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  ram?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  customFields?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  maintenanceEligible?: boolean;

  @IsOptional()
  @IsString()
  checklistMachineId?: string;
}
