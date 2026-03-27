import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const lastCategory = await this.prisma.category.findFirst({
      orderBy: { order: 'desc' } as any,
    } as any);
    const nextOrder = lastCategory ? (lastCategory as any).order + 1 : 0;

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        order: nextOrder,
      } as any,
    } as any);
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' } as any,
      include: {
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      throw new NotFoundException('Category not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Category not found');
    }
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { order: index } as any,
        } as any),
      ),
    );

    return this.findAll();
  }
}
