import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DivisionService } from './division.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';

@Controller('division')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Post()
  createDivision(@Body() dto: CreateDivisionDto) {
    return this.divisionService.createDivision(dto);
  }

  @Get()
  getAllDivisions() {
    return this.divisionService.getAllDivisions();
  }

  @Get(':id')
  getDivisionById(@Param('id') id: string) {
    return this.divisionService.getDivisionById(id);
  }

  @Put(':id')
  updateDivision(@Param('id') id: string, @Body() dto: UpdateDivisionDto) {
    return this.divisionService.updateDivision(id, dto);
  }

  @Delete(':id')
  deleteDivision(@Param('id') id: string) {
    return this.divisionService.deleteDivision(id);
  }
}
