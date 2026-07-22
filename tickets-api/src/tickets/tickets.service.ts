import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Prisma } from '@prisma/client';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { parse } from 'csv-parse/sync';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async findAll(user: any, query: any) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    // requester solo ve sus tickets
    if (user.role === 'REQUESTER') {
      where.requesterId = user.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: true,
          assignedTo: true,
          category: true,
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
      },
      error: null,
    };
  }

  async importFromCsv(file: Express.Multer.File, user: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    const text = file.buffer.toString('utf8');
    let records: any[];
    try {
      records = parse(text, { columns: true, skip_empty_lines: true });
    } catch (e: any) {
      throw new BadRequestException('Invalid CSV format: ' + (e.message ?? e));
    }

    const results: { created: any[]; errors: any[] } = { created: [], errors: [] };

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNum = i + 1;
        try {
          // Resolve requester (email required)
          const requesterEmail = row.requesterEmail || row.requester_email || row.requester;
          if (!requesterEmail) {
            results.errors.push({ row: rowNum, error: 'requesterEmail missing' });
            continue;
          }
          const requester = await tx.user.findUnique({ where: { email: requesterEmail } });
          if (!requester) {
            results.errors.push({ row: rowNum, error: `requester not found (${requesterEmail})` });
            continue;
          }

          // Optional assigned user
          let assignedToId: string | undefined = undefined;
          const assignedEmail = row.assignedToEmail || row.assigned_to_email || row.assigned_to;
          if (assignedEmail) {
            const assigned = await tx.user.findUnique({ where: { email: assignedEmail } });
            if (!assigned) {
              results.errors.push({ row: rowNum, error: `assigned user not found (${assignedEmail})` });
              continue;
            }
            assignedToId = assigned.id;
          }

          // Optional category
          let categoryId: string | undefined = undefined;
          const categoryName = row.category || row.categoryName || row.category_name;
          if (categoryName) {
            const category = await tx.category.findFirst({ where: { name: categoryName } });
            if (category) categoryId = category.id;
          }

          const data: any = {
            title: row.title ?? '(no title)',
            description: row.description ?? '',
            requesterId: requester.id,
            ticketLocation: row.ticketLocation || row.ticket_location || null,
            categoryId: categoryId ?? null,
            assignedToId: assignedToId ?? null,
          };

          if (row.priority) data.priority = (row.priority as string).toUpperCase();
          if (row.status) data.status = (row.status as string).toUpperCase();
          if (row.createdAt) data.createdAt = new Date(row.createdAt);
          if (row.closedAt) {
            data.closedAt = new Date(row.closedAt);
            data.status = 'CLOSED';
          }

          const ticket = await tx.ticket.create({ data } as any);
          results.created.push({ row: rowNum, id: ticket.id });
        } catch (e: any) {
          results.errors.push({ row: rowNum, error: e.message ?? e });
        }
      }
    });

    return { summary: { total: records.length, created: results.created.length, failed: results.errors.length }, details: results };
  }

  findOne(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        category: true,
        attachments: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, email: true, role: true },
            },
            attachments: true,
          },
        },
      },
    });
  }

  create(dto: CreateTicketDto & { requesterId: string }) {
    const data: any = {
      title: dto.title,
      description: dto.description,
      requesterId: dto.requesterId,
      ticketLocation: dto.ticketLocation,
      categoryId: dto.categoryId,
    };

    if ((dto as any).createdAt) {
      data.createdAt = new Date((dto as any).createdAt);
    }

    if ((dto as any).closedAt) {
      data.closedAt = new Date((dto as any).closedAt);
      data.status = 'CLOSED';
    }

    return this.prisma.ticket.create({ data });
  }

  async createWithAttachments(
    dto: CreateTicketDto & { requesterId: string },
    files: Express.Multer.File[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const data: any = {
        title: dto.title,
        description: dto.description,
        requesterId: dto.requesterId,
        ticketLocation: dto.ticketLocation,
        categoryId: dto.categoryId,
      };

      if ((dto as any).createdAt) data.createdAt = new Date((dto as any).createdAt);
      if ((dto as any).closedAt) {
        data.closedAt = new Date((dto as any).closedAt);
        data.status = 'CLOSED';
      }

      const ticket = await tx.ticket.create({ data } as any);

      if (files.length > 0) {
        await tx.ticketAttachment.createMany({
          data: files.map((f) => ({
            ticketId: ticket.id,
            filename: f.filename,
            original: f.originalname,
            mime: f.mimetype,
            size: f.size,
            url: `/uploads/${f.filename}`,
          })),
        });
      }

      const createdTicket = await tx.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          attachments: true,
          requester: true,
          assignedTo: true,
          category: true,
        },
      });
      if (createdTicket) {
        this.realtime.emitTicketCreated(createdTicket);
      }

      return createdTicket;
    });
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    try {
      return await this.prisma.ticket.update({
        where: { id },
        data: updateTicketDto as any,
      });
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Ticket not found');
      }
      throw e;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.ticketAttachment.deleteMany({ where: { ticketId: id } });
        await tx.ticketMessage.deleteMany({ where: { ticketId: id } });
        const ticket = await tx.ticket.delete({
          where: { id },
          include: {
            requester: true,
            assignedTo: true,
            category: true,
            attachments: true,
          },
        });
        return ticket;
      });
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Ticket not found');
      }
      throw e;
    }
  }

  async removeMessage(ticketId: string, messageId: string) {
    const message = await this.prisma.ticketMessage.findUnique({
      where: { id: messageId },
      include: { attachments: true, ticket: true },
    });

    if (!message || message.ticketId !== ticketId) {
      throw new NotFoundException('Message not found');
    }

    await this.prisma.ticketAttachment.deleteMany({
      where: { messageId },
    });

    const deleted = await this.prisma.ticketMessage.delete({
      where: { id: messageId },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
        attachments: true,
      },
    });

    return deleted;
  }

  async addMessage(
    ticketId: string,
    user: any,
    content: string | undefined,
    files: any[] = [],
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { requesterId: true, status: true },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Ticket is closed');
    }

    if (!content && files.length === 0) {
      throw new BadRequestException('Message must have content or files');
    }

    const isRequester = user.role === 'REQUESTER';
    if (isRequester && ticket.requesterId !== user.id) {
      throw new ForbiddenException();
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        content: content || '',
        ticketId,
        authorId: user.id,
      },
    });

    if (files.length > 0) {
      await this.prisma.ticketAttachment.createMany({
        data: files.map((f) => ({
          ticketId,
          messageId: message.id,
          filename: f.filename,
          original: f.originalname,
          mime: f.mimetype,
          size: f.size,
          url: `/uploads/${f.filename}`,
        })),
      });
    }

    const messageWithExtras = await this.prisma.ticketMessage.findUnique({
      where: { id: message.id },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
        attachments: true,
      },
    });

    if (messageWithExtras) {
      this.realtime.emitMessageCreated(messageWithExtras);
    }

    return messageWithExtras ?? message;
  }

  async updateStatus(
    ticketId: string,
    user: any,
    status: string,
    note?: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (user.role === 'REQUESTER') {
      throw new ForbiddenException();
    }

    const isReopen = ticket.status === 'CLOSED' && status !== 'CLOSED';
    if (isReopen && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can reopen tickets');
    }

    const closedAtValue =
      status === 'CLOSED' ? new Date() : isReopen ? null : undefined;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: status as any,
          ...(closedAtValue !== undefined ? { closedAt: closedAtValue } : {}),
        },
        include: {
          requester: true,
          assignedTo: true,
          category: true,
          attachments: true,
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId: user.id,
          content: `Status changed to ${status} by ${user.email} (${user.role})`,
        },
      });

      if (note && note.trim().length > 0) {
        await tx.ticketMessage.create({
          data: {
            ticketId,
            authorId: user.id,
            content: `Resolution note: ${note.trim()}`,
          },
        });
      }

      this.realtime.emitTicketUpdated(updated);
      return updated;
    });
  }

  async assignTicket(ticketId: string, user: any, assignedToId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === 'CLOSED')
      throw new BadRequestException('Ticket is closed');

    // Regla C:
    if (user.role === 'AGENT' && assignedToId !== user.id) {
      throw new ForbiddenException('AGENT can only assign to self');
    }
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new ForbiddenException();
    }

    const target = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!target) throw new NotFoundException('Assigned user not found');
    if (target.role === 'REQUESTER')
      throw new BadRequestException('Cannot assign to REQUESTER');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          assignedToId,
          status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
        },
        include: {
          requester: true,
          assignedTo: true,
          category: true,
          attachments: true,
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId: user.id,
          content: `Assigned to ${target.name ?? target.email} by ${user.email} (${user.role})`,
        },
      });

      this.realtime.emitTicketUpdated(updated);
      return updated;
    });
  }

  async getMyTickets(user: any) {
    return this.prisma.ticket.findMany({
      where: {
        requesterId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        requester: true,
        assignedTo: true,
      },
    });
  }

  async getAssignedTickets(user: any) {
    if (user.role === 'REQUESTER') {
      throw new ForbiddenException();
    }

    return this.prisma.ticket.findMany({
      where: {
        assignedToId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        requester: true,
        assignedTo: true,
      },
    });
  }

  async deleteAll() {
    return this.prisma.$transaction(async (tx) => {
      // Delete messages first (since no cascade)
      await tx.ticketMessage.deleteMany({});
      // Attachments will be deleted via cascade when tickets are deleted
      // Delete all tickets
      return tx.ticket.deleteMany({});
    });
  }
  // borrar todos los tickets (solo para testing, no exponer en controller)
}
