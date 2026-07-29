import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

enum MaintenanceStatusDto {
  OK = 'OK',
  NG = 'NG',
}

export class CreateMaintenanceRunDto {
  @IsString()
  machineId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsEnum(MaintenanceStatusDto)
  status: MaintenanceStatusDto;

  @IsOptional()
  @IsString()
  observation?: string;
}
