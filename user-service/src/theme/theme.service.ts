import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Theme, ThemeDocument } from '../schemas/theme.schema';
import { UpdateThemeDto } from './dto/theme.dto';

@Injectable()
export class ThemeService {
  constructor(
    @InjectModel(Theme.name)
    private themeModel: Model<ThemeDocument>,
  ) {}

  async getTheme(): Promise<Theme> {
    let theme = await this.themeModel.findOne({ themeKey: 'default' }).exec();

    if (!theme) {
      theme = await this.themeModel.create({ themeKey: 'default' });
    }

    return theme;
  }

  async updateTheme(dto: UpdateThemeDto): Promise<Theme> {
    const updatedTheme = await this.themeModel
      .findOneAndUpdate(
        { themeKey: 'default' },
        { $set: dto },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    return updatedTheme;
  }

  async resetTheme(): Promise<Theme> {
    await this.themeModel.deleteOne({ themeKey: 'default' }).exec();
    return this.themeModel.create({ themeKey: 'default' });
  }
}
