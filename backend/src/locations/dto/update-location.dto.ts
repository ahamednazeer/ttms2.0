import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationName?: string;

  @IsOptional()
  @IsMongoId()
  cityId?: string;
}
