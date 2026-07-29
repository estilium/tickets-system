import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryAssetTypeDto } from './create-inventory-asset-type.dto';

export class UpdateInventoryAssetTypeDto extends PartialType(CreateInventoryAssetTypeDto) {}
