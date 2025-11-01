/**
 * @type {import('node-pg-migrate').ColumnDefinitions}
 */
export const shorthands = {
  id: { type: 'uuid' },
  created_at: { type: 'timestamp' },
  updated_at: { type: 'timestamp' },
};
/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.createType('priority', ['HIGH', 'MEDIUM', 'LOW']);

  pgm.createTable('tasks', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'projects(id)',
      onDelete: 'CASCADE',
    },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: false, default: '' },
    due: { type: 'timestamp', notNull: true },
    priority: { type: 'priority', notNull: true, default: 'LOW' },
    finished: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER update_task_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.dropTrigger('tasks', 'update_task_updated_at');
  pgm.dropFunction('update_updated_at_column');
  pgm.dropTable('tasks');
  pgm.dropType('priority');
};
