import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  locationName: string;

  @IsMongoId()
  cityId: string;
}
