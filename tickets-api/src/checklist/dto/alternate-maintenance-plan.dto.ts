import { IsOptional, IsString } from 'class-validator';

export class AlternateMaintenancePlanDto {
  @IsOptional()
  @IsString()
  area?: string;
}
