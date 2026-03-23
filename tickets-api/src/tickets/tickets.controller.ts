import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketQueryDto } from './dto/ticket-query.dto';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
    }),
  )
  create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.ticketsService.createWithAttachments(
      { ...createTicketDto, requesterId: req.user.id },
      files || [],
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any, @Query() query: TicketQueryDto) {
    return this.ticketsService.findAll(req.user, query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyTickets(@Req() req: any) {
    return this.ticketsService.getMyTickets(req.user);
  }

  @Get('assigned')
  @UseGuards(JwtAuthGuard)
  getAssignedTickets(@Req() req: any) {
    return this.ticketsService.getAssignedTickets(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post(':id/messages')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  addMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.ticketsService.addMessage(
      id,
      req.user,
      dto.content,
      files || [],
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: any,
  ) {
    return this.ticketsService.updateStatus(id, req.user, dto.status, dto.note);
  }

  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
    @Req() req: any,
  ) {
    return this.ticketsService.assignTicket(id, req.user, dto.assignedToId);
  }
}
