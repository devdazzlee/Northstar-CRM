import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MembershipRole } from '@prisma/client'
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination.dto'

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string

  @ApiProperty({ enum: MembershipRole })
  @IsEnum(MembershipRole)
  role!: MembershipRole
}

export class ListUsersQueryDto extends PaginationQueryDto {}

export class UpdateMembershipRoleDto {
  @ApiPropertyOptional({ enum: MembershipRole })
  @IsEnum(MembershipRole)
  role!: MembershipRole
}
