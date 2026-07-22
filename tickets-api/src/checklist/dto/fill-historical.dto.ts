import { IsString } from 'class-validator';

export class FillHistoricalDto {
  @IsString()
  startDate: string; // Format: YYYY-MM-DD

  @IsString()
  endDate: string; // Format: YYYY-MM-DD
}
