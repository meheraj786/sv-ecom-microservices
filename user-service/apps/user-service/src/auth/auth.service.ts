import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginDto } from './dto/login.dto';

export interface UserRole {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    private jwtService: JwtService,
  ) {}

  async registerUser(dto: RegisterUserDto) {
    const { email, password, name } = dto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      provider: 'local',
    });

    return {
      message: 'User registered successfully',
      userId: user._id,
    };
  }

  async loginUser(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password && user.provider === 'google') {
      throw new UnauthorizedException('Please login with Google');
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      userId: user._id,
      email: user.email,
      role: 'USER',
    });

    return {
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name },
    };
  }

  async googleAuth(data: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await this.userModel.findOne({ email: data.email });

    if (!user) {
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-8),
        10,
      );
      user = await this.userModel.create({
        email: data.email,
        name: data.name || data.email.split('@')[0],
        password: randomPassword,
        provider: 'google',
      });
    }

    const token = this.jwtService.sign({
      userId: user._id,
      email: user.email,
      role: 'USER',
    });

    return {
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async registerVendor(dto: RegisterVendorDto) {
    const { email, password, name, role } = dto;

    const existingVendor = await this.vendorModel.findOne({ email });
    if (existingVendor) {
      throw new BadRequestException('Vendor account already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = await this.vendorModel.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'STAFF',
    });

    return {
      message: 'Vendor account registered successfully',
      vendorId: vendor._id,
    };
  }

  async loginVendor(dto: LoginDto) {
    const { email, password } = dto;

    const vendor = await this.vendorModel.findOne({ email });
    if (!vendor) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      userId: vendor._id,
      email: vendor.email,
      role: vendor.role,
    });

    return {
      message: 'Administrative login successful',
      token,
      vendor: {
        id: vendor._id,
        email: vendor.email,
        name: vendor.name,
        role: vendor.role,
      },
    };
  }
}
