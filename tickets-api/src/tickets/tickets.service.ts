import { Injectable , BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Prisma } from '@prisma/client';


@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

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
    error: null
  };
}

  findOne(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        attachments: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, role: true } }, 
          },
        },
      },
    });
  }

  create(dto: CreateTicketDto & { requesterId: string }) {
    return this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        requesterId: dto.requesterId,
      },
    });
  }

  async createWithAttachments(
    dto: CreateTicketDto & { requesterId: string },
    files: Express.Multer.File[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          title: dto.title,
          description: dto.description,
          requesterId: dto.requesterId,
        },
      });

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

      return tx.ticket.findUnique({
        where: { id: ticket.id },
        include: { attachments: true },
      });
    });
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
  try {
    return await this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto as any,
    });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new NotFoundException('Ticket not found');
    }
    throw e;
  }
}

 async remove(id: string) {
  try {
    return await this.prisma.ticket.delete({ where: { id } });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new NotFoundException('Ticket not found');
    }
    throw e;
  }
}

async addMessage(
  ticketId: string,
  user: any,
  content: string,
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

  const isRequester = user.role === 'REQUESTER';
  if (isRequester && ticket.requesterId !== user.id) {
    throw new ForbiddenException();
  }

  const message = await this.prisma.ticketMessage.create({
    data: {
      content,
      ticketId,
      authorId: user.id,
    },
  });

if (files.length > 0) {
  await this.prisma.ticketAttachment.createMany({
    data: files.map((f) => ({
      ticketId,
      filename: f.filename,
      original: f.originalname,
      mime: f.mimetype,
      size: f.size,
      url: `/uploads/${f.filename}`,
    })),
  });
}

  return message;
} 

  async updateStatus(ticketId: string, user: any, status: string, note?: string) {
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

      return updated;
    });
  }

  async assignTicket(ticketId: string, user: any, assignedToId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

      if (!ticket) throw new NotFoundException('Ticket not found');
      if (ticket.status === 'CLOSED') throw new BadRequestException('Ticket is closed');
     

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
    if (target.role === 'REQUESTER') throw new BadRequestException('Cannot assign to REQUESTER');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
  assignedToId,
  status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
},
      });

      await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId: user.id,
          content: `Assigned to ${target.name ?? target.email} by ${user.email} (${user.role})`,
        },
      });

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

}
