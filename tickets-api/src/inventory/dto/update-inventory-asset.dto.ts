import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryAssetDto } from './create-inventory-asset.dto';

export class UpdateInventoryAssetDto extends PartialType(CreateInventoryAssetDto) {}
