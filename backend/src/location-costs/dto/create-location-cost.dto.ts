import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateLocationCostDto {
  @IsMongoId()
  fromLocationId: string;

  @IsMongoId()
  toLocationId: string;

  @IsMongoId()
  cityId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cost: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance?: number;
}
