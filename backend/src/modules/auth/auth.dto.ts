import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organizationName!: string

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens',
  })
  @MaxLength(80)
  organizationSlug!: string

  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}

export class LoginDto {
  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email!: string

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string

  @ApiPropertyOptional({ description: 'Organization slug when user belongs to multiple orgs' })
  @IsOptional()
  @IsString()
  organizationSlug?: string
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string
}
