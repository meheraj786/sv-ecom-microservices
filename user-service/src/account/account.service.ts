import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account, AccountDocument } from '../schemas/account.schema';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  async getSettings(vendorId: string) {
    const settings = await this.accountModel.findOne({
      vendorId: new Types.ObjectId(vendorId),
    });

    if (!settings) {
      return {
        themeColor: '#6366F1',
        bannerLayout: 'HERO_SPLIT',
        bannerImages: [],
        featuredCategoryIds: [],
      };
    }
    return settings;
  }
  async updateSettings(vendorId: string, dto: UpdateAccountDto) {
    const settings = await this.accountModel.findOneAndUpdate(
      { vendorId: new Types.ObjectId(vendorId) },
      { $set: dto },
      { new: true, upsert: true },
    );

    return {
      message: 'Store settings updated successfully',
      settings,
    };
  }
}
