import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { async } from 'rxjs/internal/scheduler/async';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async mttr(days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: 'CLOSED',
        closedAt: {
          not: null,
          gte: from,
        },
      },
      select: { createdAt: true, closedAt: true },
    });

    const totalClosed = tickets.length;

    if (totalClosed === 0) {
      return {
        days,
        from,
        to: new Date(),
        totalClosed: 0,
        mttrMinutesAvg: 0,
        mttrMinutesMin: 0,
        mttrMinutesMax: 0,
      };
    }

    const durationsMinutes = tickets.map(t => {
      const ms = t.closedAt!.getTime() - t.createdAt.getTime();
      return ms / (1000 * 60);
    });

    const sum = durationsMinutes.reduce((a, b) => a + b, 0);
    const avg = sum / totalClosed;
    const min = Math.min(...durationsMinutes);
    const max = Math.max(...durationsMinutes);

    return {
      days,
      from,
      to: new Date(),
      totalClosed,
      mttrMinutesAvg: Number(avg.toFixed(2)),
      mttrMinutesMin: Number(min.toFixed(2)),
      mttrMinutesMax: Number(max.toFixed(2)),
    };
  }
  
async mttrCalendar(year: number, month: number) {
  // month: 1-12
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // primer día del siguiente mes

  const tickets = await this.prisma.ticket.findMany({
    where: {
      status: 'CLOSED',
      closedAt: {
        not: null,
        gte: from,
        lt: to,
      },
    },
    select: { createdAt: true, closedAt: true },
  });

  const totalClosed = tickets.length;

  if (totalClosed === 0) {
    return {
      year,
      month,
      from,
      to,
      totalClosed: 0,
      mttrMinutesAvg: 0,
      mttrMinutesMin: 0,
      mttrMinutesMax: 0,
    };
  }

  const durationsMinutes = tickets.map(t => {
    const ms = t.closedAt!.getTime() - t.createdAt.getTime();
    return ms / (1000 * 60);
  });

  const sum = durationsMinutes.reduce((a, b) => a + b, 0);
  const avg = sum / totalClosed;
  const min = Math.min(...durationsMinutes);
  const max = Math.max(...durationsMinutes);

  return {
    year,
    month,
    from,
    to,
    totalClosed,
    mttrMinutesAvg: Number(avg.toFixed(2)),
    mttrMinutesMin: Number(min.toFixed(2)),
    mttrMinutesMax: Number(max.toFixed(2)),
  };
}

async dashboard() {
  const [openTickets, closedTickets, mttr, byAgent] = await Promise.all([
    // tickets abiertos
    this.prisma.ticket.count({
      where: { status: { not: 'CLOSED' } },
    }),

    // tickets cerrados
    this.prisma.ticket.count({
      where: { status: 'CLOSED' },
    }),

    // reutilizamos tu cálculo de MTTR (últimos 30 días)
    this.mttr(30),

    // tickets cerrados por agente (groupBy)
    this.prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: {
        status: 'CLOSED',
        assignedToId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

//ticket by status


  // Traer nombres de agentes
  const agentIds = byAgent.map(r => r.assignedToId).filter(Boolean) as string[];

  const agents = await this.prisma.user.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true, email: true },
  });

  const agentMap = new Map(agents.map(a => [a.id, a]));

  const ticketsByAgent = byAgent.map(r => {
    const agent = agentMap.get(r.assignedToId!);
    return {
      agent: agent?.name ?? agent?.email ?? 'Unknown',
      count: r._count._all,
    };
  });

  return {
    data: {
      openTickets,
      closedTickets,
      mttrMinutes: mttr.mttrMinutesAvg,
      ticketsByAgent,
    },
    meta: null,
    error: null,
  };
}

async ticketsByStatus() {
  const result = await this.prisma.ticket.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  return {
    data: result.map(r => ({
      status: r.status,
      count: r._count.status,
    })),
    meta: null,
    error: null,
  };
}

async mttrByDay(days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const tickets = await this.prisma.ticket.findMany({
    where: {
      status: 'CLOSED',
      closedAt: {
        not: null,
        gte: from,
      },
    },
    select: {
      createdAt: true,
      closedAt: true,
    },
  });

  const grouped: Record<string, number[]> = {};

  tickets.forEach(t => {
    const date = t.closedAt!.toISOString().split('T')[0];

    const duration =
      (t.closedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60);

    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(duration);
  });

  const result = Object.entries(grouped).map(([date, values]) => {
    const avg =
      values.reduce((a, b) => a + b, 0) / values.length;

    return {
      date,
      mttr: Math.min(Number(avg.toFixed(2)), 1440), // máximo 1 día
    };
  });

  return {
    data: result,
    meta: null,
    error: null,
  };
}

}
