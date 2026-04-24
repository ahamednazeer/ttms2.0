import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cityName?: string;
}
