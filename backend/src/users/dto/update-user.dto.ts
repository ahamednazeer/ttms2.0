import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const userRoles = ['SUPERADMIN', 'VENDOR', 'TRANSPORT', 'USER'] as const;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password?: string;

  @IsOptional()
  @IsEnum(userRoles)
  role?: (typeof userRoles)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsMongoId()
  cityId?: string;
}
