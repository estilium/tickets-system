import { IsOptional, IsString } from 'class-validator';

export class DuplicateMachineDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;
}
