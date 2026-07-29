import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryBrandDto } from './create-inventory-brand.dto';

export class UpdateInventoryBrandDto extends PartialType(CreateInventoryBrandDto) {}
