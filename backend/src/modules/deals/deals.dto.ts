import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { DealStage } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination.dto'

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountCents?: number

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string

  @ApiPropertyOptional({ enum: DealStage, default: DealStage.LEAD })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedClose?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string
}

export class UpdateDealDto extends PartialType(CreateDealDto) {}

export class ListDealsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DealStage })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage
}
