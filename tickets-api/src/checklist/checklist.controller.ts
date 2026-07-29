import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ChecklistService } from './checklist.service';
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

@ApiTags('checklist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklist')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get('machines')
  findMachines(@Query('includeInactive') includeInactive?: string, @Req() req?: any) {
    return this.checklistService.findMachines(includeInactive === 'true', req?.user);
  }

  @Post('machines')
  @UseGuards(AdminGuard)
  createMachine(@Body() dto: CreateMachineDto, @Req() req: any) {
    return this.checklistService.createMachine(dto, req.user);
  }

  @Post('machines/reorder')
  @UseGuards(AdminGuard)
  reorderMachines(@Body() dto: ReorderMachinesDto) {
    console.log('Reorder endpoint called with:', dto);
    return this.checklistService.reorderMachines(dto);
  }

  @Post('machines/maintenance/alternate')
  @UseGuards(AdminGuard)
  alternateMaintenancePlan(@Body() dto: AlternateMaintenancePlanDto, @Req() req: any) {
    return this.checklistService.alternateMaintenancePlan(dto, req.user);
  }

  @Patch('machines/:id')
  @UseGuards(AdminGuard)
  updateMachine(@Param('id') id: string, @Body() dto: UpdateMachineDto, @Req() req: any) {
    return this.checklistService.updateMachine(id, dto, req.user);
  }

  @Post('machines/:id/duplicate')
  @UseGuards(AdminGuard)
  duplicateMachine(@Param('id') id: string, @Body() dto: DuplicateMachineDto, @Req() req: any) {
    return this.checklistService.duplicateMachine(id, dto, req.user);
  }

  @Delete('machines/:id')
  @UseGuards(AdminGuard)
  removeMachine(@Param('id') id: string, @Req() req: any) {
    return this.checklistService.removeMachine(id, req.user);
  }

  @Delete('machines/:id/hard')
  @UseGuards(AdminGuard)
  hardDeleteMachine(@Param('id') id: string, @Req() req: any) {
    return this.checklistService.hardDeleteMachine(id, req.user);
  }

  @Post('machines/:machineId/items')
  @UseGuards(AdminGuard)
  createItem(@Param('machineId') machineId: string, @Body() dto: CreateItemDto, @Req() req: any) {
    return this.checklistService.createItem(machineId, dto, req.user);
  }

  @Patch('items/:id')
  @UseGuards(AdminGuard)
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.checklistService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @UseGuards(AdminGuard)
  removeItem(@Param('id') id: string) {
    return this.checklistService.removeItem(id);
  }

  @Delete('items/:id/hard')
  @UseGuards(AdminGuard)
  hardDeleteItem(@Param('id') id: string) {
    return this.checklistService.hardDeleteItem(id);
  }

  @Post('fill-historical')
  @UseGuards(AdminGuard)
  fillHistorical(@Body() dto: FillHistoricalDto, @Req() req: any) {
    return this.checklistService.fillHistorical(dto, req.user.id);
  }

  @Get('daily')
  dailyStatus(@Query('date') date: string, @Req() req?: any) {
    return this.checklistService.dailyStatus(date, req?.user);
  }

  @Post('runs')
  createRun(@Body() dto: CreateRunDto, @Req() req: any) {
    return this.checklistService.createRun(dto, req.user);
  }

  @Get('maintenance/month')
  maintenanceMonth(@Query('month') month: string, @Req() req?: any) {
    return this.checklistService.maintenanceMonth(month, req?.user);
  }

  @Post('maintenance/runs')
  createMaintenanceRun(@Body() dto: CreateMaintenanceRunDto, @Req() req: any) {
    return this.checklistService.createMaintenanceRun(dto, req.user);
  }

  @Get('maintenance/annual')
  maintenanceAnnualReport(@Query('year') year: string, @Req() req?: any) {
    return this.checklistService.maintenanceAnnualReport(Number(year), req?.user);
  }

  @Get('report')
  report(@Query('month') month: string, @Query('machineId') machineId?: string, @Req() req?: any) {
    return this.checklistService.report(month, machineId, req?.user);
  }
}
