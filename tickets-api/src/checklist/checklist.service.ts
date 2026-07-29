import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlternateMaintenancePlanDto } from './dto/alternate-maintenance-plan.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateMachineDto } from './dto/create-machine.dto';
import { CreateMaintenanceRunDto } from './dto/create-maintenance-run.dto';
import { CreateRunDto } from './dto/create-run.dto';
import { DuplicateMachineDto } from './dto/duplicate-machine.dto';
import { FillHistoricalDto } from './dto/fill-historical.dto';
import { ReorderMachinesDto } from './dto/reorder-machines.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

const dayStart = (date: string) => {
  const normalized = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(normalized.getTime())) {
    throw new BadRequestException('Fecha invalida');
  }
  return normalized;
};

const monthRange = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number);
  if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) {
    throw new BadRequestException('Mes invalido');
  }

  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  const days = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return { start, end, days };
};

const parseYearMonth = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number);
  if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) {
    throw new BadRequestException('Mes invalido');
  }
  return { year, month: monthIndex };
};

@Injectable()
export class ChecklistService {
  constructor(private prisma: PrismaService) {}

  createMachine(dto: CreateMachineDto, user?: any) {
    if (user?.assignedArea && dto.area?.trim() && dto.area.trim() !== user.assignedArea) {
      throw new ForbiddenException('No puedes crear máquinas fuera de tu área');
    }

    return (this.prisma as any).checklistMachine.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        area: user?.assignedArea ? user.assignedArea : dto.area?.trim() || null,
        category: dto.category?.trim() || null,
        active: dto.active ?? true,
        maintenanceEnabled: dto.maintenanceEnabled ?? false,
        maintenanceFrequencyMonths: dto.maintenanceFrequencyMonths ?? 2,
        maintenanceStartMonth: dto.maintenanceStartMonth ?? null,
        maintenanceType: dto.maintenanceType?.trim() || 'Preventivo',
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  private async ensureMachineForUser(id: string, user?: any) {
    const machine = await (this.prisma as any).checklistMachine.findUnique({
      where: { id },
    });

    if (!machine) {
      throw new NotFoundException('Maquina no encontrada');
    }

    if (user?.assignedArea && machine.area !== user.assignedArea) {
      throw new ForbiddenException('No puedes gestionar máquinas de otra área');
    }

    return machine;
  }

  findMachines(includeInactive = false, user?: any) {
    const where: any = includeInactive ? {} : { active: true };
    if (user?.assignedArea) {
      where.area = user.assignedArea;
    }

    return (this.prisma as any).checklistMachine.findMany({
      where,
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: [{ order: 'asc' }, { code: 'asc' }],
    });
  }

  async updateMachine(id: string, dto: UpdateMachineDto, user?: any) {
    await this.ensureMachineForUser(id, user);

    const normalizedArea = dto.area === null ? null : dto.area?.trim();
    if (user?.assignedArea && dto.area !== undefined && normalizedArea !== user.assignedArea) {
      throw new ForbiddenException('No puedes cambiar el área de la máquina');
    }

    try {
      return await (this.prisma as any).checklistMachine.update({
        where: { id },
        data: {
          ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.area !== undefined ? { area: normalizedArea } : {}),
          ...(dto.category !== undefined
            ? { category: dto.category?.trim() || null }
            : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          ...(dto.maintenanceEnabled !== undefined
            ? { maintenanceEnabled: dto.maintenanceEnabled }
            : {}),
          ...(dto.maintenanceFrequencyMonths !== undefined
            ? { maintenanceFrequencyMonths: dto.maintenanceFrequencyMonths }
            : {}),
          ...(dto.maintenanceStartMonth !== undefined
            ? { maintenanceStartMonth: dto.maintenanceStartMonth }
            : {}),
          ...(dto.maintenanceType !== undefined
            ? { maintenanceType: dto.maintenanceType?.trim() || 'Preventivo' }
            : {}),
        },
        include: { items: { orderBy: { order: 'asc' } } },
      });
    } catch {
      throw new NotFoundException('Maquina no encontrada');
    }
  }

  async removeMachine(id: string, user?: any) {
    const machine = await this.ensureMachineForUser(id, user);

    const runCount = await (this.prisma as any).checklistRun.count({
      where: { machineId: id },
    });

    if (runCount === 0) {
      return (this.prisma as any).checklistMachine.delete({
        where: { id },
      });
    }

    return (this.prisma as any).$transaction(async (tx) => {
      await tx.checklistItem.updateMany({
        where: { machineId: id },
        data: { active: false },
      });

      return tx.checklistMachine.update({
        where: { id },
        data: { active: false },
        include: { items: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async hardDeleteMachine(id: string, user?: any) {
    const machine = await this.ensureMachineForUser(id, user);

    return (this.prisma as any).$transaction(async (tx) => {
      await tx.checklistRun.deleteMany({
        where: { machineId: id },
      });

      return tx.checklistMachine.delete({
        where: { id },
      });
    });
  }

  async duplicateMachine(id: string, dto: DuplicateMachineDto, user?: any) {
    await this.ensureMachineForUser(id, user);

    const source = await (this.prisma as any).checklistMachine.findUnique({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!source) {
      throw new NotFoundException('Maquina no encontrada');
    }

    const code = dto.code.trim();
    if (!code) {
      throw new BadRequestException('El codigo de la nueva maquina es obligatorio');
    }

    return (this.prisma as any).checklistMachine.create({
      data: {
        code,
        name: dto.name?.trim() || `${source.name} copia`,
        area: source.area,
        category: source.category,
        active: source.active,
        maintenanceEnabled: source.maintenanceEnabled,
        maintenanceFrequencyMonths: source.maintenanceFrequencyMonths,
        maintenanceStartMonth: source.maintenanceStartMonth,
        maintenanceType: source.maintenanceType,
        items: {
          create: source.items.map((item) => ({
            label: item.label,
            description: item.description,
            order: item.order,
            active: item.active,
          })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async createItem(machineId: string, dto: CreateItemDto, user?: any) {
    await this.ensureMachineForUser(machineId, user);

    const lastItem = await (this.prisma as any).checklistItem.findFirst({
      where: { machineId },
      orderBy: { order: 'desc' },
    });

    return (this.prisma as any).checklistItem.create({
      data: {
        machineId,
        label: dto.label.trim(),
        description: dto.description?.trim() || null,
        order: dto.order ?? (lastItem ? lastItem.order + 1 : 0),
        active: dto.active ?? true,
      },
    });
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    try {
      return await (this.prisma as any).checklistItem.update({
        where: { id },
        data: {
          ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
        },
      });
    } catch {
      throw new NotFoundException('Punto de revision no encontrado');
    }
  }

  async removeItem(id: string) {
    const item = await (this.prisma as any).checklistItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Punto de revision no encontrado');
    }

    const responseCount = await (this.prisma as any).checklistResponse.count({
      where: { itemId: id },
    });

    if (responseCount === 0) {
      return (this.prisma as any).checklistItem.delete({ where: { id } });
    }

    return (this.prisma as any).checklistItem.update({
      where: { id },
      data: { active: false },
    });
  }

  async hardDeleteItem(id: string) {
    const item = await (this.prisma as any).checklistItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Punto de revision no encontrado');
    }

    return (this.prisma as any).$transaction(async (tx) => {
      await tx.checklistResponse.deleteMany({
        where: { itemId: id },
      });

      return tx.checklistItem.delete({
        where: { id },
      });
    });
  }

  async dailyStatus(date: string, user?: any) {
    const currentDate = dayStart(date);
    const where: any = { active: true };
    if (user?.assignedArea) {
      where.area = user.assignedArea;
    }

    const machines = await (this.prisma as any).checklistMachine.findMany({
      where,
      include: {
        items: { where: { active: true }, orderBy: { order: 'asc' } },
        runs: {
          where: { date: currentDate },
          include: {
            responses: { include: { item: true } },
            agent: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return machines.map((machine) => ({
      ...machine,
      runs: machine.runs.map((run) => ({
        ...run,
        hasNg: run.responses.some((response) => response.status === 'NG'),
      })),
    }));
  }

  async createRun(dto: CreateRunDto, user: { id: string; assignedArea?: string }) {
    const date = dayStart(dto.date);
    const machine = await (this.prisma as any).checklistMachine.findUnique({
      where: { id: dto.machineId },
      include: { items: { where: { active: true } } },
    });

    if (!machine) {
      throw new NotFoundException('Maquina no encontrada');
    }

    if (user?.assignedArea && machine.area !== user.assignedArea) {
      throw new ForbiddenException('No puedes rellenar checklists de otra área');
    }

    const itemIds = new Set(machine.items.map((item) => item.id));
    const responseIds = new Set(dto.responses.map((response) => response.itemId));

    if (itemIds.size !== responseIds.size) {
      throw new BadRequestException('Responde todos los puntos del checklist');
    }

    for (const response of dto.responses) {
      if (!itemIds.has(response.itemId)) {
        throw new BadRequestException('El punto de revision no pertenece a esta maquina');
      }
      if (response.status === 'NG' && !response.observation?.trim()) {
        throw new BadRequestException('Cada NG requiere observacion');
      }
    }

    return (this.prisma as any).$transaction(async (tx) => {
      const existing = await tx.checklistRun.findUnique({
        where: {
          machineId_date_shift: {
            machineId: dto.machineId,
            date,
            shift: dto.shift,
          },
        },
      });

      if (existing) {
        await tx.checklistResponse.deleteMany({ where: { runId: existing.id } });
        return tx.checklistRun.update({
          where: { id: existing.id },
          data: {
            agentId: user.id,
            responses: {
              create: dto.responses.map((response) => ({
                itemId: response.itemId,
                status: response.status,
                observation: response.observation?.trim() || null,
              })),
            },
          },
          include: this.runInclude(),
        });
      }

      return tx.checklistRun.create({
        data: {
          machineId: dto.machineId,
          agentId: user.id,
          date,
          shift: dto.shift,
          responses: {
            create: dto.responses.map((response) => ({
              itemId: response.itemId,
              status: response.status,
              observation: response.observation?.trim() || null,
            })),
          },
        },
        include: this.runInclude(),
      });
    });
  }

  async report(month: string, machineId?: string, user?: any) {
    const { start, end, days } = monthRange(month);
    const machineFilter: any = { active: true };
    if (machineId) {
      machineFilter.id = machineId;
    }
    if (user?.assignedArea) {
      machineFilter.area = user.assignedArea;
    }

    const machines = await (this.prisma as any).checklistMachine.findMany({
      where: machineFilter,
      orderBy: { code: 'asc' },
    });

    const allowedMachineIds = machines.map((machine) => machine.id);

    const runs = await (this.prisma as any).checklistRun.findMany({
      where: {
        date: { gte: start, lt: end },
        machineId: { in: allowedMachineIds },
      },
      include: this.runInclude(),
      orderBy: [{ date: 'desc' }, { shift: 'asc' }],
    });

    const expected = machines.length * days * 2;
    const completed = runs.length;
    const withNg = runs.filter((run) =>
      run.responses.some((response) => response.status === 'NG'),
    ).length;
    const compliance = expected ? Math.round((completed / expected) * 1000) / 10 : 0;

    const byShift = ['SHIFT_1', 'SHIFT_2'].map((shift) => {
      const shiftCompleted = runs.filter((run) => run.shift === shift).length;
      const shiftExpected = machines.length * days;
      return {
        shift,
        expected: shiftExpected,
        completed: shiftCompleted,
        compliance: shiftExpected
          ? Math.round((shiftCompleted / shiftExpected) * 1000) / 10
          : 0,
      };
    });

    const byMachine = machines.map((machine) => {
      const machineRuns = runs.filter((run) => run.machineId === machine.id);
      const machineExpected = days * 2;
      return {
        machine,
        expected: machineExpected,
        completed: machineRuns.length,
        withNg: machineRuns.filter((run) =>
          run.responses.some((response) => response.status === 'NG'),
        ).length,
        compliance: Math.round((machineRuns.length / machineExpected) * 1000) / 10,
      };
    });

    return { month, expected, completed, withNg, compliance, byShift, byMachine, runs };
  }

  private isMaintenanceDue(machine: any, year: number, month: number) {
    if (!machine.maintenanceEnabled) return false;
    const frequency = machine.maintenanceFrequencyMonths || 2;
    const startMonth = machine.maintenanceStartMonth || 1;
    const monthOffset = (year * 12 + month) - (year * 12 + startMonth);
    return monthOffset >= 0 && monthOffset % frequency === 0;
  }

  async maintenanceMonth(monthValue: string, user?: any) {
    const { year, month } = parseYearMonth(monthValue);
    const where: any = { active: true, maintenanceEnabled: true };
    if (user?.assignedArea) {
      where.area = user.assignedArea;
    }

    const machines = await (this.prisma as any).checklistMachine.findMany({
      where,
      orderBy: [{ order: 'asc' }, { code: 'asc' }],
    });
    const dueMachines = machines.filter((machine) => this.isMaintenanceDue(machine, year, month));
    const runs = await (this.prisma as any).maintenanceRun.findMany({
      where: {
        year,
        month,
        machineId: { in: dueMachines.map((machine) => machine.id) },
      },
      include: { agent: { select: { id: true, name: true, username: true } } },
    });
    const runsByMachine = new Map(runs.map((run) => [run.machineId, run]));

    return {
      year,
      month,
      expected: dueMachines.length,
      completed: runs.length,
      withNg: runs.filter((run) => run.status === 'NG').length,
      compliance: dueMachines.length ? Math.round((runs.length / dueMachines.length) * 1000) / 10 : 0,
      machines: dueMachines.map((machine) => ({
        ...machine,
        maintenanceRun: runsByMachine.get(machine.id) ?? null,
      })),
    };
  }

  async createMaintenanceRun(dto: CreateMaintenanceRunDto, user: { id: string; assignedArea?: string }) {
    const machine = await (this.prisma as any).checklistMachine.findUnique({
      where: { id: dto.machineId },
    });
    if (!machine) {
      throw new NotFoundException('Maquina no encontrada');
    }
    if (user?.assignedArea && machine.area !== user.assignedArea) {
      throw new ForbiddenException('No puedes capturar mantenimientos de otra area');
    }
    if (!this.isMaintenanceDue(machine, dto.year, dto.month)) {
      throw new BadRequestException('Esta maquina no esta programada para mantenimiento en este mes');
    }
    if (dto.status === 'NG' && !dto.observation?.trim()) {
      throw new BadRequestException('Cada NG requiere observacion');
    }

    return (this.prisma as any).maintenanceRun.upsert({
      where: {
        machineId_year_month: {
          machineId: dto.machineId,
          year: dto.year,
          month: dto.month,
        },
      },
      create: {
        machineId: dto.machineId,
        agentId: user.id,
        year: dto.year,
        month: dto.month,
        status: dto.status,
        observation: dto.observation?.trim() || null,
      },
      update: {
        agentId: user.id,
        status: dto.status,
        observation: dto.observation?.trim() || null,
        completedAt: new Date(),
      },
      include: {
        machine: true,
        agent: { select: { id: true, name: true, username: true } },
      },
    });
  }

  async maintenanceAnnualReport(year: number, user?: any) {
    if (!year || year < 2000 || year > 2100) {
      throw new BadRequestException('Ano invalido');
    }

    const where: any = { active: true, maintenanceEnabled: true };
    if (user?.assignedArea) {
      where.area = user.assignedArea;
    }

    const machines = await (this.prisma as any).checklistMachine.findMany({
      where,
      orderBy: [{ area: 'asc' }, { order: 'asc' }, { code: 'asc' }],
    });
    const runs = await (this.prisma as any).maintenanceRun.findMany({
      where: {
        year,
        machineId: { in: machines.map((machine) => machine.id) },
      },
      include: { agent: { select: { id: true, name: true, username: true } } },
    });
    const runKey = (machineId: string, month: number) => `${machineId}:${month}`;
    const runsByMachineMonth = new Map<string, any>(
      runs.map((run) => [runKey(run.machineId, run.month), run]),
    );

    let expected = 0;
    let completed = 0;
    let withNg = 0;

    const rows = machines.map((machine) => {
      const months = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const planned = this.isMaintenanceDue(machine, year, month);
        const run = runsByMachineMonth.get(runKey(machine.id, month)) ?? null;
        if (planned) expected++;
        if (run) completed++;
        if (run?.status === 'NG') withNg++;
        return {
          month,
          planned,
          status: run?.status ?? (planned ? 'PRG' : 'NA'),
          observation: run?.observation ?? null,
          agent: run?.agent ?? null,
        };
      });
      const machineExpected = months.filter((item) => item.planned).length;
      const machineCompleted = months.filter((item) => item.status === 'OK' || item.status === 'NG').length;
      return {
        machine,
        months,
        total: machineCompleted,
        expected: machineExpected,
        percent: machineExpected ? Math.round((machineCompleted / machineExpected) * 1000) / 10 : 0,
      };
    });

    return {
      year,
      expected,
      completed,
      withNg,
      percent: expected ? Math.round((completed / expected) * 1000) / 10 : 0,
      rows,
    };
  }

  private ensureMachine(id: string) {
    return (this.prisma as any).checklistMachine
      .findUnique({ where: { id } })
      .then((machine) => {
        if (!machine) throw new NotFoundException('Maquina no encontrada');
        return machine;
      });
  }

  private runInclude() {
    return {
      machine: true,
      agent: { select: { id: true, name: true, username: true } },
      responses: {
        include: { item: true },
        orderBy: { createdAt: 'asc' },
      },
    };
  }

  async reorderMachines(dto: ReorderMachinesDto) {
    const updates = dto.machineIds.map((id, index) =>
      (this.prisma as any).checklistMachine.update({
        where: { id },
        data: { order: index },
      }),
    );

    await (this.prisma as any).$transaction(updates);
    
    return (this.prisma as any).checklistMachine.findMany({
      where: { id: { in: dto.machineIds } },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async alternateMaintenancePlan(dto: AlternateMaintenancePlanDto, user?: any) {
    const requestedArea = dto.area?.trim() || null;
    if (user?.assignedArea && requestedArea && requestedArea !== user.assignedArea) {
      throw new ForbiddenException('No puedes configurar mantenimientos de otra area');
    }

    const where: any = { active: true };
    if (user?.assignedArea) {
      where.area = user.assignedArea;
    } else if (requestedArea) {
      where.area = requestedArea;
    }

    const machines = await (this.prisma as any).checklistMachine.findMany({
      where,
      orderBy: [{ order: 'asc' }, { code: 'asc' }],
    });

    if (machines.length === 0) {
      throw new NotFoundException('No hay maquinas activas para asignar');
    }

    const updates = machines.map((machine, index) =>
      (this.prisma as any).checklistMachine.update({
        where: { id: machine.id },
        data: {
          maintenanceEnabled: true,
          maintenanceFrequencyMonths: 2,
          maintenanceStartMonth: index % 2 === 0 ? 1 : 2,
          maintenanceType: machine.maintenanceType || 'Preventivo',
        },
      }),
    );

    await (this.prisma as any).$transaction(updates);

    const oddMonthCount = Math.ceil(machines.length / 2);
    const evenMonthCount = Math.floor(machines.length / 2);
    return {
      total: machines.length,
      oddMonthCount,
      evenMonthCount,
      message: `Se asignaron ${machines.length} maquinas: ${oddMonthCount} en meses nones y ${evenMonthCount} en meses pares`,
    };
  }

  async fillHistorical(dto: FillHistoricalDto, agentId: string) {
    const startDate = new Date(`${dto.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${dto.endDate}T23:59:59.999Z`);

    if (startDate > endDate) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const machines = await (this.prisma as any).checklistMachine.findMany({
      where: { active: true },
      include: { items: { where: { active: true }, orderBy: { order: 'asc' } } },
    });

    if (machines.length === 0) {
      throw new NotFoundException('No hay máquinas activas');
    }

    let createdCount = 0;
    const shifts = ['SHIFT_1', 'SHIFT_2'];

    // Iterar por cada día en el rango
    for (
      let currentDate = new Date(startDate);
      currentDate <= endDate;
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    ) {
      const dateStr = currentDate.toISOString().slice(0, 10);

      // Para cada máquina
      for (const machine of machines) {
        // Para cada turno
        for (const shift of shifts) {
          // Verificar si ya existe este run
          const existing = await (this.prisma as any).checklistRun.findUnique({
            where: {
              machineId_date_shift: {
                machineId: machine.id,
                date: currentDate,
                shift,
              },
            },
          });

          if (!existing && machine.items.length > 0) {
            // Crear run con respuestas OK
            await (this.prisma as any).checklistRun.create({
              data: {
                machineId: machine.id,
                agentId,
                date: currentDate,
                shift,
                responses: {
                  create: machine.items.map((item) => ({
                    itemId: item.id,
                    status: 'OK',
                    observation: null,
                  })),
                },
              },
            });
            createdCount++;
          }
        }
      }
    }

    return { createdCount, message: `Se crearon ${createdCount} registros de checklist` };
  }
}
