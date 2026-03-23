import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAgents() {
    return this.prisma.user.findMany({
      where: {
        role: 'AGENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }
}
