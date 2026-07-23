import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  findPublic() {
    return this.prisma.announcement.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  create(dto: CreateAnnouncementDto, authorId?: string) {
    this.validateContent(dto.title, dto.body);

    return this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        active: dto.active ?? true,
        authorId,
      },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Aviso no encontrado');
    }

    const title = dto.title?.trim();
    const body = dto.body?.trim();

    if (title !== undefined || body !== undefined) {
      this.validateContent(title ?? announcement.title, body ?? announcement.body);
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body !== undefined ? { body } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async remove(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Aviso no encontrado');
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  private validateContent(title: string, body: string) {
    if (!title.trim() || title.trim().length < 3) {
      throw new BadRequestException('El titulo debe tener al menos 3 caracteres');
    }

    if (!body.trim() || body.trim().length < 5) {
      throw new BadRequestException('El mensaje debe tener al menos 5 caracteres');
    }
  }
}
