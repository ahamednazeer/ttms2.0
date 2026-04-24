import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateLocationCostDto {
  @IsMongoId()
  fromLocationId: string;

  @IsMongoId()
  toLocationId: string;

  @IsMongoId()
  cityId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance: number;
}
