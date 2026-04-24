import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier: string;
}
