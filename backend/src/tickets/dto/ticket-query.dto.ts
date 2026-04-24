import { IsIn, IsMongoId, IsOptional } from 'class-validator';

export class TicketQueryDto {
  @IsOptional()
  @IsIn(['PENDING', 'ASSIGNED', 'RIDE_STARTED', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsMongoId()
  cityId?: string;

  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
