import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async create(createLocationDto: CreateLocationDto) {
    const lastLocation = await this.prisma.ticketLocation.findFirst({
      orderBy: { order: 'desc' },
    });
    const nextOrder = lastLocation ? lastLocation.order + 1 : 0;

    return this.prisma.ticketLocation.create({
      data: {
        name: createLocationDto.name,
        order: nextOrder,
      },
    });
  }

  async findAll() {
    return this.prisma.ticketLocation.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async update(id: string, updateLocationDto: UpdateLocationDto) {
    try {
      return await this.prisma.ticketLocation.update({
        where: { id },
        data: updateLocationDto,
      });
    } catch (error) {
      throw new NotFoundException('Location not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.ticketLocation.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Location not found');
    }
  }
}
