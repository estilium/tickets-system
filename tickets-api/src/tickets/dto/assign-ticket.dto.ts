import { IsString, IsUUID, IsOptional, isString } from 'class-validator';

export class AssignTicketDto {
  @IsString()
  ticketLocation: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsString()
  assignedToId: string;
}
