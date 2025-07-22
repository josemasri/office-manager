import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../entities/system-config.entity';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
  ) {}

  async getConfig(key: string): Promise<string | null> {
    const config = await this.systemConfigRepository.findOne({
      where: { configKey: key },
    });
    return config ? config.configValue : null;
  }

  async setConfig(
    key: string,
    value: string,
    description?: string,
  ): Promise<SystemConfig> {
    let config = await this.systemConfigRepository.findOne({
      where: { configKey: key },
    });

    if (config) {
      config.configValue = value;
      if (description) {
        config.description = description;
      }
    } else {
      config = this.systemConfigRepository.create({
        configKey: key,
        configValue: value,
        description: description || '',
      });
    }

    return this.systemConfigRepository.save(config);
  }

  async getAllConfigs(): Promise<SystemConfig[]> {
    return this.systemConfigRepository.find({
      order: { configKey: 'ASC' },
    });
  }

  async getTimezone(): Promise<string> {
    const timezone = await this.getConfig('system_timezone');
    return timezone || 'America/Mexico_City'; // Default timezone
  }

  async setTimezone(timezone: string): Promise<SystemConfig> {
    return this.setConfig(
      'system_timezone',
      timezone,
      'Timezone configuration for the office manager system',
    );
  }

  /**
   * Get current date in the system's configured timezone
   */
  async getCurrentDateInSystemTimezone(): Promise<Date> {
    const timezone = await this.getTimezone();
    const now = new Date();

    // Convert current UTC time to system timezone
    const systemTime = new Date(
      now.toLocaleString('en-US', { timeZone: timezone }),
    );

    return systemTime;
  }

  /**
   * Convert a date to the system's configured timezone
   */
  async convertToSystemTimezone(date: Date): Promise<Date> {
    const timezone = await this.getTimezone();

    // Convert the date to system timezone
    const systemTime = new Date(
      date.toLocaleString('en-US', { timeZone: timezone }),
    );

    return systemTime;
  }
}
