import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTransportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  vehicleNo: string;

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

  @IsMongoId()
  cityId: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
