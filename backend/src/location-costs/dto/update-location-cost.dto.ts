import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLocationCostDto {
  @IsOptional()
  @IsMongoId()
  fromLocationId?: string;

  @IsOptional()
  @IsMongoId()
  toLocationId?: string;

  @IsOptional()
  @IsMongoId()
  cityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance?: number;
}
