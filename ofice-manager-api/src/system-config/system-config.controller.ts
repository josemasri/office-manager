import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface UpdateTimezoneDto {
  timezone: string;
}

interface SetConfigDto {
  key: string;
  value: string;
  description?: string;
}

@Controller('system-config')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async getAllConfigs() {
    try {
      return await this.systemConfigService.getAllConfigs();
    } catch {
      throw new HttpException(
        'Error fetching system configurations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('timezone')
  async getTimezone() {
    try {
      const timezone = await this.systemConfigService.getTimezone();
      return { timezone };
    } catch {
      throw new HttpException(
        'Error fetching timezone configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('timezone')
  async updateTimezone(@Body() updateTimezoneDto: UpdateTimezoneDto) {
    try {
      const { timezone } = updateTimezoneDto;

      if (!timezone) {
        throw new HttpException('Timezone is required', HttpStatus.BAD_REQUEST);
      }

      // Validate timezone format
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        throw new HttpException(
          'Invalid timezone format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const config = await this.systemConfigService.setTimezone(timezone);
      return {
        message: 'Timezone updated successfully',
        config,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error updating timezone configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('config')
  async setConfig(@Body() setConfigDto: SetConfigDto) {
    try {
      const { key, value, description } = setConfigDto;

      if (!key || !value) {
        throw new HttpException(
          'Key and value are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const config = await this.systemConfigService.setConfig(
        key,
        value,
        description,
      );
      return {
        message: 'Configuration updated successfully',
        config,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error updating configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
