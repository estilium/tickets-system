import { Controller, Get, Query, UseGuards, Post, BadRequestException } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

  @Get('mttr-record')
  getMttrRecord(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    if (!year || !month) {
      throw new BadRequestException('year and month are required');
    }
    return this.metricsService.mttrReport(Number(year), Number(month));
  }

  @Get('mttr-records')
  getMttrRecords() {
    return this.metricsService.mttrReports();
  }

  @Post('mttr/backfill')
  @UseGuards(AdminGuard)
  backfillMttr(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    if (!year || !month) {
      throw new BadRequestException('year and month are required');
    }
    return this.metricsService.createOrUpdateMttrReport(
      Number(year),
      Number(month),
    );
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
