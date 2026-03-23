import { IsString, IsUUID, IsOptional } from 'class-validator';

export class AssignTicketDto {
@IsString()
ticketLocation: string;

@IsOptional()
@IsString()
categoryId?: string;
}