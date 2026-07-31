import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryBaseCategoryDto } from './create-inventory-base-category.dto';

export class UpdateInventoryBaseCategoryDto extends PartialType(CreateInventoryBaseCategoryDto) {}
