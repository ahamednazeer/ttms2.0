import { IsEmail, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  vendorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contact?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsMongoId()
  cityId?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
