import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsNotEmpty()
  ticketLocation: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
