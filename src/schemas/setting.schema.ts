import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { HydratedDocument } from 'mongoose';
import { Type } from 'class-transformer';

export type SettingDocument = HydratedDocument<Setting>;

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

export class ThemeBackground {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  color?: string;
}

export class ThemePalette {
  @ApiProperty()
  @IsString()
  @Prop()
  primary: string;

  @ApiProperty()
  @IsString()
  @Prop()
  secondary: string;
}

export class ThemeTypography {
  @ApiProperty()
  @IsString()
  @Prop()
  font: string;

  @ApiProperty()
  @IsString()
  @Prop()
  provider: string;
}

@Schema({
  collection: 'settings',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Setting {
  @ApiProperty()
  @Prop()
  @IsString()
  theme: string;

  @ApiProperty()
  @IsEnum(ThemeMode)
  @Prop()
  mode: ThemeMode;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ThemePalette)
  @Prop({ type: ThemePalette })
  palette: ThemePalette;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ThemeTypography)
  @Prop({ type: ThemeTypography })
  typography: ThemeTypography;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ThemeBackground)
  @Prop({ type: ThemeBackground })
  background: ThemeBackground;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
