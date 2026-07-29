import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  maintenanceFrequencyMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  maintenanceStartMonth?: number;

  @IsOptional()
  @IsString()
  maintenanceType?: string;
}
