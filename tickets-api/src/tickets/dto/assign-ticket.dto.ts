import { IsString, IsUUID } from 'class-validator';

export class AssignTicketDto {
 @IsString()
  assignedToId: string;
}