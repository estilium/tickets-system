import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum ChecklistShiftDto {
  SHIFT_1 = 'SHIFT_1',
  SHIFT_2 = 'SHIFT_2',
}

enum ChecklistItemStatusDto {
  OK = 'OK',
  NG = 'NG',
}

class ChecklistResponseDto {
  @IsString()
  itemId: string;

  @IsEnum(ChecklistItemStatusDto)
  status: ChecklistItemStatusDto;

  @IsOptional()
  @IsString()
  observation?: string;
}

export class CreateRunDto {
  @IsString()
  machineId: string;

  @IsString()
  date: string;

  @IsEnum(ChecklistShiftDto)
  shift: ChecklistShiftDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseDto)
  responses: ChecklistResponseDto[];
}
