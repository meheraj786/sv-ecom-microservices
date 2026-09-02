import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ThemeDocument = Theme & Document;

@Schema({ _id: false })
export class NavbarConfig {
  @Prop({ type: Number, default: 1 })
  layout: number;

  @Prop({ type: [String], default: [] })
  menus: string[];
}

@Schema({ _id: false })
export class BannerConfig {
  @Prop({ type: Number, default: 1 })
  layout: number;

  @Prop({ type: String, default: 'Elevate Your Everyday' })
  slogan: string;

  @Prop({
    type: String,
    default: 'Curated lifestyle pieces built with precision and durability.',
  })
  paragraph: string;

  @Prop({ type: [String], default: [] })
  bgImg?: string[];

  @Prop({ type: [String], default: [] })
  productId?: string[];

  @Prop({ type: String, default: '' })
  categoryId?: string;
}

@Schema({ _id: false })
export class CategorySectionConfig {
  @Prop({ type: Number, default: 1 })
  layout: number;

  @Prop({ type: [String], default: [] })
  catOrsubCatIds: string[];

  @Prop({ type: Number, default: 6 })
  max: number;
}

@Schema({ _id: false })
export class ProductBySectionConfig {
  @Prop({ type: Number, default: 1 })
  layout: number;

  @Prop({ type: String, default: '' })
  catOrSubcatOrmenu: string;

  @Prop({ type: Number, default: 8 })
  max: number;
}

@Schema({ _id: false })
export class SaleBannerConfig {
  @Prop({ type: String, default: 'Seasonal Flash Sale' })
  name: string;

  @Prop({ type: String, default: 'Up to 50% Off Selected Collections' })
  title: string;

  @Prop({
    type: String,
    default: 'Limited time promotion across all essential apparel and tech.',
  })
  para: string;

  @Prop({ type: String, default: '/shop' })
  link: string;

  @Prop({ type: String, default: 'LUMINA50' })
  coupon: string;

  @Prop({ type: String, default: '#111827' })
  bgColor: string;
}

@Schema({ _id: false })
export class ShowcasePageConfig {
  @Prop({ type: String, default: '' })
  bgImg?: string;

  @Prop({ type: String, default: '#f8f9fb' })
  bgColor: string;

  @Prop({ type: String, default: 'Curated Collection' })
  title: string;

  @Prop({
    type: String,
    default: 'Discover the latest additions to our catalogue',
  })
  slogan: string;
}

@Schema({ _id: false })
export class FooterConfig {
  @Prop({ type: Number, default: 1 })
  layout: number;
}

@Schema({ _id: false })
export class StatItem {
  @Prop({ type: String, required: true })
  label: string;

  @Prop({ type: String, required: true })
  value: string;
}

@Schema({ _id: false })
export class ValueItem {
  @Prop({ type: String, required: true })
  icon: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;
}

@Schema({ _id: false })
export class TimelineItem {
  @Prop({ type: String, required: true })
  year: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;
}

@Schema({ _id: false })
export class MissionConfig {
  @Prop({ type: String, default: 'Our mission' })
  title: string;

  @Prop({
    type: String,
    default:
      'To make thoughtfully designed, genuinely durable goods accessible without the premium markup.',
  })
  body: string;
}

@Schema({ _id: false })
export class QuoteConfig {
  @Prop({
    type: String,
    default:
      "We'd rather ship four things a year that we're proud of than forty that we're not.",
  })
  text: string;

  @Prop({ type: String, default: 'Amara Chowdhury, Founder' })
  author: string;
}

@Schema({ _id: false })
export class CtaConfig {
  @Prop({ type: String, default: 'Join the journey.' })
  title: string;

  @Prop({
    type: String,
    default:
      'Shop the current collection, or reach out if you’d like to work with us.',
  })
  description: string;

  @Prop({ type: String, default: 'Shop the collection' })
  primaryBtn: string;

  @Prop({ type: String, default: 'Get in touch' })
  secondaryBtn: string;
}

@Schema({ _id: false })
export class AboutPageConfig {
  @Prop({ type: String, default: 'Since 2019' })
  badge: string;

  @Prop({ type: String, default: 'Designing everyday' })
  heading: string;

  @Prop({ type: String, default: 'essentials' })
  highlightText: string;

  @Prop({ type: String, default: 'that last.' })
  headingSuffix: string;

  @Prop({
    type: String,
    default:
      'We started with a simple question: why does buying something that lasts have to mean giving up on good design?',
  })
  intro: string;

  @Prop({ type: MissionConfig, default: () => ({}) })
  mission: MissionConfig;

  @Prop({
    type: [StatItem],
    default: [
      { label: 'Founded', value: '2019' },
      { label: 'Orders shipped', value: '120K+' },
      { label: 'Countries served', value: '24' },
      { label: 'Average rating', value: '4.8/5' },
    ],
  })
  stats: StatItem[];

  @Prop({
    type: [ValueItem],
    default: [
      {
        icon: 'Leaf',
        title: 'Sustainable by default',
        description:
          "Responsibly sourced materials and packaging that doesn't end up as waste.",
      },
      {
        icon: 'ShieldCheck',
        title: 'Built to last',
        description:
          'Every piece is stress-tested well past what a normal return policy requires.',
      },
      {
        icon: 'Users',
        title: 'Community first',
        description:
          'Product decisions start from customer feedback, not the other way around.',
      },
      {
        icon: 'Sparkles',
        title: 'Considered design',
        description:
          'Nothing ships until it earns its place — no filler, no unnecessary variants.',
      },
    ],
  })
  values: ValueItem[];

  @Prop({
    type: [TimelineItem],
    default: [
      {
        year: '2019',
        title: 'The idea',
        description:
          'Started in a spare room with one product and a list of frustrations with alternatives.',
      },
      {
        year: '2021',
        title: 'First storefront',
        description:
          'Opened our first small studio space and shipped our 10,000th order.',
      },
      {
        year: '2023',
        title: 'Going global',
        description: 'Expanded shipping to 24 countries and grew the team.',
      },
      {
        year: '2025',
        title: 'Today',
        description:
          'Still run with the same care, asking the same question about every product.',
      },
    ],
  })
  timeline: TimelineItem[];

  @Prop({ type: QuoteConfig, default: () => ({}) })
  quote: QuoteConfig;

  @Prop({ type: CtaConfig, default: () => ({}) })
  cta: CtaConfig;
}

@Schema({ timestamps: true })
export class Theme {
  @Prop({ type: String, default: 'default', unique: true })
  themeKey: string;

  @Prop({ type: String, default: '' })
  logo: string;

  @Prop({ type: String, default: '' })
  favicon: string;

  @Prop({ type: String, default: '#111827' })
  primaryColor: string;

  @Prop({ type: NavbarConfig, default: () => ({}) })
  navbar: NavbarConfig;

  @Prop({ type: BannerConfig, default: () => ({}) })
  banner: BannerConfig;

  @Prop({ type: CategorySectionConfig, default: () => ({}) })
  shopByCategoryOrSubcategory: CategorySectionConfig;

  @Prop({ type: [ProductBySectionConfig], default: [] })
  productBy: ProductBySectionConfig[];

  @Prop({ type: SaleBannerConfig, default: () => ({}) })
  sale: SaleBannerConfig;

  @Prop({ type: ShowcasePageConfig, default: () => ({}) })
  newPage: ShowcasePageConfig;

  @Prop({ type: ShowcasePageConfig, default: () => ({}) })
  featuredPage: ShowcasePageConfig;

  @Prop({ type: ShowcasePageConfig, default: () => ({}) })
  bestPage: ShowcasePageConfig;

  @Prop({ type: FooterConfig, default: () => ({}) })
  footer: FooterConfig;

  @Prop({ type: AboutPageConfig, default: () => ({}) })
  aboutPage: AboutPageConfig;
}

export const ThemeSchema = SchemaFactory.createForClass(Theme);
