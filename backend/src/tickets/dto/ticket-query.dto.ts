import { IsIn, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class TicketQueryDto extends PaginationQueryDto {
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
