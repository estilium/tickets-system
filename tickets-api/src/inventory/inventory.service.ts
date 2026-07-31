import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryAssetDto } from './dto/create-inventory-asset.dto';
import { CreateInventoryBulkDto } from './dto/create-inventory-bulk.dto';
import { CreateInventoryAssetTypeDto } from './dto/create-inventory-asset-type.dto';
import { CreateInventoryBaseCategoryDto } from './dto/create-inventory-base-category.dto';
import { CreateInventoryBrandDto } from './dto/create-inventory-brand.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { UpdateInventoryAssetDto } from './dto/update-inventory-asset.dto';
import { UpdateInventoryAssetTypeDto } from './dto/update-inventory-asset-type.dto';
import { UpdateInventoryBaseCategoryDto } from './dto/update-inventory-base-category.dto';
import { UpdateInventoryBrandDto } from './dto/update-inventory-brand.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: InventoryQueryDto) {
    const where: Prisma.InventoryAssetWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.department) where.department = { contains: query.department, mode: 'insensitive' };
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { assetTag: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.inventoryAsset.findMany({
      where,
      include: {
        assetType: { select: { id: true, code: true, name: true, labelPrefix: true, criteria: true, baseCategory: true } },
        checklistMachine: { select: { id: true, code: true, name: true, maintenanceEnabled: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 300,
    });
  }

  async summary() {
    const [total, byStatus, byType, maintenanceEligible] = await Promise.all([
      this.prisma.inventoryAsset.count(),
      this.prisma.inventoryAsset.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.inventoryAsset.groupBy({ by: ['type'], _count: { type: true } }),
      this.prisma.inventoryAsset.count({ where: { maintenanceEligible: true } }),
    ]);

    return { total, byStatus, byType, maintenanceEligible };
  }

  async findOne(id: string) {
    const asset = await this.prisma.inventoryAsset.findUnique({
      where: { id },
      include: {
        checklistMachine: { select: { id: true, code: true, name: true, maintenanceEnabled: true } },
        assetType: { select: { id: true, code: true, name: true, labelPrefix: true, criteria: true, baseCategory: true } },
        events: {
          include: { actor: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) throw new NotFoundException('Activo no encontrado');
    return asset;
  }

  async create(dto: CreateInventoryAssetDto, actor: any) {
    this.ensureCanManage(actor);
    const data = await this.prepareAssetData(dto, {});

    const asset = await this.prisma.inventoryAsset.create({
      data: {
        ...data,
        events: {
          create: {
            actorId: actor?.id,
            action: 'CREATED',
            toValue: this.eventLabel(data),
          },
        },
      },
    });

    return this.findOne(asset.id);
  }

  async createBulk(dto: CreateInventoryBulkDto, actor: any) {
    this.ensureCanManage(actor);
    const counters: Record<string, number> = {};
    const prepared: Record<string, any>[] = [];
    for (const asset of dto.assets) {
      prepared.push(await this.prepareAssetData(asset, counters));
    }

    const created = await this.prisma.$transaction(
      prepared.map((data) =>
        this.prisma.inventoryAsset.create({
          data: {
            ...data,
            events: {
              create: {
                actorId: actor?.id,
                action: 'BULK_CREATED',
                toValue: this.eventLabel(data),
              },
            },
          },
        }),
      ),
    );

    return { created: created.length, assets: created };
  }

  async findTypes(includeInactive = false) {
    return this.prisma.inventoryAssetType.findMany({
      where: includeInactive ? undefined : { active: true },
      include: { baseCategory: true, _count: { select: { assets: true } } },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async findBaseCategories(includeInactive = false) {
    return this.prisma.inventoryBaseCategory.findMany({
      where: includeInactive ? undefined : { active: true },
      include: { _count: { select: { assetTypes: true } } },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async createBaseCategory(dto: CreateInventoryBaseCategoryDto, actor: any) {
    this.ensureCanManage(actor);
    const data = this.cleanBaseCategoryData(dto);
    if (!data.code || !data.name) throw new BadRequestException('Codigo y nombre son obligatorios');
    return this.prisma.inventoryBaseCategory.create({
      data: data as Prisma.InventoryBaseCategoryUncheckedCreateInput,
    });
  }

  async updateBaseCategory(id: string, dto: UpdateInventoryBaseCategoryDto, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryBaseCategory.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Categoria base no encontrada');
    return this.prisma.inventoryBaseCategory.update({ where: { id }, data: this.cleanBaseCategoryData(dto) });
  }

  async removeBaseCategory(id: string, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryBaseCategory.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Categoria base no encontrada');
    return this.prisma.inventoryBaseCategory.update({ where: { id }, data: { active: false } });
  }

  async previewLabels(assetTypeId: string, count: number) {
    const safeCount = Math.max(1, Math.min(count || 1, 100));
    const labels = await this.generateAssetTags(assetTypeId, safeCount);
    return { labels };
  }

  async findBrands(includeInactive = false) {
    return this.prisma.inventoryBrand.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async createBrand(dto: CreateInventoryBrandDto, actor: any) {
    this.ensureCanManage(actor);
    const data = this.cleanBrandData(dto);
    if (!data.name) {
      throw new BadRequestException('Nombre de marca obligatorio');
    }
    return this.prisma.inventoryBrand.create({
      data: data as Prisma.InventoryBrandUncheckedCreateInput,
    });
  }

  async updateBrand(id: string, dto: UpdateInventoryBrandDto, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryBrand.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Marca no encontrada');

    return this.prisma.inventoryBrand.update({
      where: { id },
      data: this.cleanBrandData(dto),
    });
  }

  async removeBrand(id: string, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryBrand.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Marca no encontrada');

    return this.prisma.inventoryBrand.update({
      where: { id },
      data: { active: false },
    });
  }

  async createType(dto: CreateInventoryAssetTypeDto, actor: any) {
    this.ensureCanManage(actor);
    const data = this.cleanTypeData(dto);
    if (!data.code || !data.name || !data.labelPrefix) {
      throw new BadRequestException('Codigo, nombre y prefijo son obligatorios');
    }
    return this.prisma.inventoryAssetType.create({
      data: data as Prisma.InventoryAssetTypeUncheckedCreateInput,
    });
  }

  async updateType(id: string, dto: UpdateInventoryAssetTypeDto, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryAssetType.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Tipo de activo no encontrado');

    return this.prisma.inventoryAssetType.update({
      where: { id },
      data: this.cleanTypeData(dto),
    });
  }

  async removeType(id: string, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryAssetType.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Tipo de activo no encontrado');

    return this.prisma.inventoryAssetType.update({
      where: { id },
      data: { active: false },
    });
  }

  async update(id: string, dto: UpdateInventoryAssetDto, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryAsset.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Activo no encontrado');

    const data = this.cleanData(dto);
    await this.applyConfiguredType(data);
    const events = this.buildChangeEvents(current, data, actor?.id);

    await this.prisma.inventoryAsset.update({
      where: { id },
      data: {
        ...data,
        events: events.length ? { create: events } : undefined,
      },
    });

    return this.findOne(id);
  }

  private async prepareAssetData(dto: CreateInventoryAssetDto, tagCounters: Record<string, number>) {
    const data = this.cleanData(dto);
    await this.applyConfiguredType(data);
    if (!data.assetTag && data.assetTypeId) {
      data.assetTag = await this.generateNextAssetTag(data.assetTypeId, tagCounters);
    }
    if (!data.assetTag && !data.serialNumber && !data.model) {
      throw new BadRequestException('Captura al menos etiqueta, serie o modelo');
    }
    return data;
  }

  async remove(id: string, actor: any) {
    this.ensureCanManage(actor);
    const current = await this.prisma.inventoryAsset.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Activo no encontrado');

    await this.prisma.inventoryAsset.update({
      where: { id },
      data: {
        status: AssetStatus.DISPOSED,
        events: {
          create: {
            actorId: actor?.id,
            action: 'STATUS_CHANGED',
            fromValue: current.status,
            toValue: AssetStatus.DISPOSED,
            note: 'Baja logica desde inventario',
          },
        },
      },
    });

    return { ok: true };
  }

  private cleanData(dto: CreateInventoryAssetDto | UpdateInventoryAssetDto) {
    const clean = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    };

    const data: Record<string, any> = {};
    const setString = (field: keyof CreateInventoryAssetDto) => {
      if (dto[field] !== undefined) data[field] = clean(dto[field] as string);
    };

    setString('assetTag');
    setString('assetTypeId');
    setString('department');
    setString('location');
    setString('assignedTo');
    setString('assignedEmail');
    setString('brand');
    setString('model');
    setString('serialNumber');
    setString('os');
    setString('ram');
    setString('ipAddress');
    setString('notes');
    setString('checklistMachineId');

    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.customFields !== undefined) data.customFields = dto.customFields;
    if (dto.maintenanceEligible !== undefined) data.maintenanceEligible = dto.maintenanceEligible;

    return data;
  }

  private cleanTypeData(dto: CreateInventoryAssetTypeDto | UpdateInventoryAssetTypeDto) {
    const clean = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    };

    const data: Record<string, any> = {};
    if (dto.code !== undefined) data.code = clean(dto.code)?.toUpperCase().replace(/\s+/g, '_');
    if (dto.name !== undefined) data.name = clean(dto.name);
    if (dto.labelPrefix !== undefined) data.labelPrefix = this.normalizeLabelPrefix(dto.labelPrefix);
    if (dto.baseCategoryId !== undefined) data.baseCategoryId = clean(dto.baseCategoryId);
    if (dto.baseType !== undefined) data.baseType = dto.baseType;
    if (dto.description !== undefined) data.description = clean(dto.description);
    if (dto.criteria !== undefined) data.criteria = dto.criteria;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.order !== undefined) data.order = dto.order;
    return data;
  }

  private cleanBaseCategoryData(dto: CreateInventoryBaseCategoryDto | UpdateInventoryBaseCategoryDto) {
    const data: Record<string, any> = {};
    if (dto.code !== undefined) data.code = dto.code.trim().toUpperCase().replace(/\s+/g, '_') || null;
    if (dto.name !== undefined) data.name = dto.name.trim() || null;
    if (dto.legacyType !== undefined) data.legacyType = dto.legacyType;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.order !== undefined) data.order = dto.order;
    return data;
  }

  private cleanBrandData(dto: CreateInventoryBrandDto | UpdateInventoryBrandDto) {
    const data: Record<string, any> = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      data.name = name || null;
    }
    if (dto.appliesTo !== undefined) data.appliesTo = dto.appliesTo;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.order !== undefined) data.order = dto.order;
    return data;
  }

  private async applyConfiguredType(data: Record<string, any>) {
    if (!data.assetTypeId) return;

    const assetType = await this.prisma.inventoryAssetType.findUnique({
      where: { id: data.assetTypeId },
      select: { baseType: true, active: true, baseCategory: { select: { legacyType: true, active: true } } },
    });

    if (!assetType || !assetType.active || (assetType.baseCategory && !assetType.baseCategory.active)) {
      throw new BadRequestException('Tipo de activo no valido');
    }

    data.type = assetType.baseCategory?.legacyType ?? assetType.baseType;
  }

  private normalizeLabelPrefix(value?: string | null) {
    const prefix = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
    if (!prefix || prefix.length > 3) {
      throw new BadRequestException('El prefijo de etiqueta debe tener de 1 a 3 caracteres');
    }
    return prefix;
  }

  private async generateAssetTags(assetTypeId: string, count: number) {
    const start = await this.getNextSequence(assetTypeId);
    const assetType = await this.prisma.inventoryAssetType.findUnique({
      where: { id: assetTypeId },
      select: { labelPrefix: true, active: true },
    });
    if (!assetType || !assetType.active) {
      throw new BadRequestException('Tipo de activo no valido');
    }

    return Array.from({ length: count }, (_, index) => this.formatAssetTag(assetType.labelPrefix, start + index));
  }

  private async generateNextAssetTag(assetTypeId: string, counters: Record<string, number>) {
    if (counters[assetTypeId] === undefined) {
      counters[assetTypeId] = await this.getNextSequence(assetTypeId);
    }

    const assetType = await this.prisma.inventoryAssetType.findUnique({
      where: { id: assetTypeId },
      select: { labelPrefix: true, active: true },
    });
    if (!assetType || !assetType.active) {
      throw new BadRequestException('Tipo de activo no valido');
    }

    const tag = this.formatAssetTag(assetType.labelPrefix, counters[assetTypeId]);
    counters[assetTypeId] += 1;
    return tag;
  }

  private async getNextSequence(assetTypeId: string) {
    const assetType = await this.prisma.inventoryAssetType.findUnique({
      where: { id: assetTypeId },
      select: { labelPrefix: true, active: true },
    });
    if (!assetType || !assetType.active) {
      throw new BadRequestException('Tipo de activo no valido');
    }

    const tagPrefix = `MXMAU-IT-${assetType.labelPrefix}-`;
    const assets = await this.prisma.inventoryAsset.findMany({
      where: { assetTag: { startsWith: tagPrefix } },
      select: { assetTag: true },
    });

    const escapedPrefix = assetType.labelPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tagPattern = new RegExp(`^MXMAU-IT-${escapedPrefix}-(\\d+)$`);
    const maxSequence = assets.reduce((max, asset) => {
      const match = asset.assetTag?.match(tagPattern);
      if (!match) return max;
      return Math.max(max, Number(match[1]) || 0);
    }, 0);

    return maxSequence + 1;
  }

  private formatAssetTag(labelPrefix: string, sequence: number) {
    return `MXMAU-IT-${labelPrefix}-${String(sequence).padStart(3, '0')}`;
  }

  private ensureCanManage(actor: any) {
    if (!actor || !['ADMIN', 'AGENT'].includes(actor.role)) {
      throw new ForbiddenException('No tienes permisos para administrar inventario');
    }
  }

  private eventLabel(data: Record<string, any>) {
    return [data.assetTag, data.brand, data.model, data.serialNumber].filter(Boolean).join(' / ');
  }

  private buildChangeEvents(current: Record<string, any>, data: Record<string, any>, actorId?: string) {
    const tracked = ['assetTypeId', 'status', 'assignedTo', 'department', 'location', 'serialNumber', 'ipAddress', 'maintenanceEligible'];

    return tracked
      .filter((field) => data[field] !== undefined && data[field] !== current[field])
      .map((field) => ({
        actorId,
        action: field === 'status' ? 'STATUS_CHANGED' : 'UPDATED_' + field.toUpperCase(),
        fromValue: current[field] === null || current[field] === undefined ? null : String(current[field]),
        toValue: data[field] === null || data[field] === undefined ? null : String(data[field]),
      }));
  }
}
