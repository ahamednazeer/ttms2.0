import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cityId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cityName: string;
}
