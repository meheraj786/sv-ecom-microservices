import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NavbarDto {
  @IsOptional()
  @IsNumber()
  layout?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  menus?: string[];
}

export class ProductDto {
  @IsOptional()
  @IsNumber()
  cardLayout?: number;

  @IsOptional()
  @IsNumber()
  detailLayout?: number;
}

export class SocialLinksDto {
  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;
}

export class ChatDto {
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  messengerUsername?: string;

  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @IsOptional()
  @IsBoolean()
  isWhatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isMessengerEnabled?: boolean;
}

export class SeoDto {
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;

  @IsOptional()
  @IsString()
  facebookPixelId?: string;
}

export class BannerDto {
  @IsOptional()
  @IsNumber()
  layout?: number;

  @IsOptional()
  @IsString()
  slogan?: string;

  @IsOptional()
  @IsString()
  paragraph?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bgImg?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productId?: string[];

  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class CategorySectionDto {
  @IsOptional()
  @IsNumber()
  layout?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  catOrsubCatIds?: string[];

  @IsOptional()
  @IsNumber()
  max?: number;
}

export class ProductBySectionDto {
  @IsOptional()
  @IsNumber()
  layout?: number;

  @IsOptional()
  @IsString()
  catOrSubcatOrmenu?: string;

  @IsOptional()
  @IsNumber()
  max?: number;
}

export class SaleBannerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  para?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  coupon?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;
}

export class ShowcasePageDto {
  @IsOptional()
  @IsString()
  bgImg?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slogan?: string;
}

export class FooterDto {
  @IsOptional()
  @IsNumber()
  layout?: number;

  @IsOptional()
  @IsString()
  copyright?: string;

  @IsOptional()
  @IsString()
  contactInfo?: string;
}

export class StatItemDto {
  @IsString()
  label: string;

  @IsString()
  value: string;
}

export class ValueItemDto {
  @IsString()
  icon: string;

  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class TimelineItemDto {
  @IsString()
  year: string;

  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class MissionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class QuoteDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  author?: string;
}

export class CtaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  primaryBtn?: string;

  @IsOptional()
  @IsString()
  secondaryBtn?: string;
}

export class AboutPageDto {
  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  highlightText?: string;

  @IsOptional()
  @IsString()
  headingSuffix?: string;

  @IsOptional()
  @IsString()
  intro?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MissionDto)
  mission?: MissionDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatItemDto)
  stats?: StatItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueItemDto)
  values?: ValueItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineItemDto)
  timeline?: TimelineItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => QuoteDto)
  quote?: QuoteDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CtaDto)
  cta?: CtaDto;
}

export class UpdateThemeDto {
  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  favicon?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NavbarDto)
  navbar?: NavbarDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDto)
  product?: ProductDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChatDto)
  chat?: ChatDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDto)
  seo?: SeoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BannerDto)
  banner?: BannerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategorySectionDto)
  shopByCategoryOrSubcategory?: CategorySectionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductBySectionDto)
  productBy?: ProductBySectionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SaleBannerDto)
  sale?: SaleBannerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShowcasePageDto)
  newPage?: ShowcasePageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShowcasePageDto)
  featuredPage?: ShowcasePageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShowcasePageDto)
  bestPage?: ShowcasePageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FooterDto)
  footer?: FooterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AboutPageDto)
  aboutPage?: AboutPageDto;
}
