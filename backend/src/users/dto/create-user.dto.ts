import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const userRoles = ['SUPERADMIN', 'VENDOR', 'TRANSPORT', 'USER'] as const;

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password: string;

  @IsEnum(userRoles)
  role: (typeof userRoles)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

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
