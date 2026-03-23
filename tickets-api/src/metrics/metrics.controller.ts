import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('mttr')
  getMttr(
    @Query('days') days?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    if (year && month) {
      return this.metricsService.mttrCalendar(Number(year), Number(month));
    }

    const nDays = days ? Number(days) : 30;
    return this.metricsService.mttr(nDays);
  }

  @Get('dashboard')
  dashboard() {
    return this.metricsService.dashboard();
  }

  @Get('tickets-by-status')
  ticketsByStatus() {
    return this.metricsService.ticketsByStatus();
  }

  @Get('mttr-by-day')
  mttrByDay(@Query('days') days?: string) {
    return this.metricsService.mttrByDay(Number(days) || 7);
  }
}
