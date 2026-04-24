import { IsBoolean, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTransportDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  vehicleNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contact?: string;

  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @IsOptional()
  @IsMongoId()
  cityId?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
