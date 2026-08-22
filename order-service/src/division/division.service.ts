import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';

@Injectable()
export class DivisionService {
  constructor(private prisma: PrismaService) {}

  async createDivision(dto: CreateDivisionDto) {
    const name = dto.name.trim();

    const existing = await this.prisma.division.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Division with this name already exists');
    }

    return this.prisma.division.create({
      data: {
        name,
        deliveryCharge: Number(dto.deliveryCharge),
      },
    });
  }

  async getAllDivisions() {
    return this.prisma.division.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getDivisionById(id: string) {
    const division = await this.prisma.division.findUnique({
      where: { id },
    });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    return division;
  }

  async updateDivision(id: string, dto: UpdateDivisionDto) {
    const division = await this.prisma.division.findUnique({
      where: { id },
    });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    if (dto.name) {
      const name = dto.name.trim();
      const existing = await this.prisma.division.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
          NOT: {
            id,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('Division with this name already exists');
      }
    }

    return this.prisma.division.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.deliveryCharge !== undefined && {
          deliveryCharge: Number(dto.deliveryCharge),
        }),
      },
    });
  }

  async deleteDivision(id: string) {
    const division = await this.prisma.division.findUnique({
      where: { id },
    });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    await this.prisma.division.delete({
      where: { id },
    });

    return {
      message: 'Division deleted successfully',
    };
  }
}
