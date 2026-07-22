import { IsArray, IsString } from 'class-validator';

export class ReorderMachinesDto {
  @IsArray()
  @IsString({ each: true })
  machineIds: string[];
}
