import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemConfig1674123456790 implements MigrationInterface {
  name = 'AddSystemConfig1674123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create system_config table
    await queryRunner.query(`
      CREATE TABLE "system_config" (
        "id" SERIAL NOT NULL,
        "config_key" character varying NOT NULL,
        "config_value" text NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_system_config_config_key" UNIQUE ("config_key"),
        CONSTRAINT "PK_system_config_id" PRIMARY KEY ("id")
      )
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_system_config_config_key" ON "system_config" ("config_key")
    `);

    // Create trigger to automatically update updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON "system_config" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert default timezone configuration
    await queryRunner.query(`
      INSERT INTO "system_config" ("config_key", "config_value", "description") 
      VALUES ('system_timezone', 'America/Mexico_City', 'Timezone configuration for the office manager system');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_system_config_updated_at ON "system_config"
    `);

    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_system_config_config_key"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "system_config"`);
  }
}
