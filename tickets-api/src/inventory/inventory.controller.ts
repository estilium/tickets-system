import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
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
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('summary')
  summary() {
    return this.inventoryService.summary();
  }

  @Get('types')
  findTypes(@Query('includeInactive') includeInactive?: string) {
    return this.inventoryService.findTypes(includeInactive === 'true');
  }

  @Get('types/:id/labels')
  previewLabels(@Param('id') id: string, @Query('count') count?: string) {
    return this.inventoryService.previewLabels(id, Number(count) || 1);
  }

  @Get('brands')
  findBrands(@Query('includeInactive') includeInactive?: string) {
    return this.inventoryService.findBrands(includeInactive === 'true');
  }

  @Get('base-categories')
  findBaseCategories(@Query('includeInactive') includeInactive?: string) {
    return this.inventoryService.findBaseCategories(includeInactive === 'true');
  }

  @Post('base-categories')
  createBaseCategory(@Body() dto: CreateInventoryBaseCategoryDto, @Req() req: any) {
    return this.inventoryService.createBaseCategory(dto, req.user);
  }

  @Patch('base-categories/:id')
  updateBaseCategory(@Param('id') id: string, @Body() dto: UpdateInventoryBaseCategoryDto, @Req() req: any) {
    return this.inventoryService.updateBaseCategory(id, dto, req.user);
  }

  @Delete('base-categories/:id')
  removeBaseCategory(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.removeBaseCategory(id, req.user);
  }

  @Post('brands')
  createBrand(@Body() dto: CreateInventoryBrandDto, @Req() req: any) {
    return this.inventoryService.createBrand(dto, req.user);
  }

  @Patch('brands/:id')
  updateBrand(@Param('id') id: string, @Body() dto: UpdateInventoryBrandDto, @Req() req: any) {
    return this.inventoryService.updateBrand(id, dto, req.user);
  }

  @Delete('brands/:id')
  removeBrand(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.removeBrand(id, req.user);
  }

  @Post('types')
  createType(@Body() dto: CreateInventoryAssetTypeDto, @Req() req: any) {
    return this.inventoryService.createType(dto, req.user);
  }

  @Patch('types/:id')
  updateType(@Param('id') id: string, @Body() dto: UpdateInventoryAssetTypeDto, @Req() req: any) {
    return this.inventoryService.updateType(id, dto, req.user);
  }

  @Delete('types/:id')
  removeType(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.removeType(id, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInventoryAssetDto, @Req() req: any) {
    return this.inventoryService.create(dto, req.user);
  }

  @Post('bulk')
  createBulk(@Body() dto: CreateInventoryBulkDto, @Req() req: any) {
    return this.inventoryService.createBulk(dto, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryAssetDto, @Req() req: any) {
    return this.inventoryService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.remove(id, req.user);
  }
}
