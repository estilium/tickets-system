import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}