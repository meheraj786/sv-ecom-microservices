import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { UpdateThemeDto } from './dto/theme.dto';

@Controller('theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  getTheme() {
    return this.themeService.getTheme();
  }

  @Put()
  updateTheme(@Body() dto: UpdateThemeDto) {
    return this.themeService.updateTheme(dto);
  }

  @Post('reset')
  resetTheme() {
    return this.themeService.resetTheme();
  }
}
