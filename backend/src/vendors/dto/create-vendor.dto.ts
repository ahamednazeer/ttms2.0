import { IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  vendorName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contact?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsMongoId()
  cityId: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
