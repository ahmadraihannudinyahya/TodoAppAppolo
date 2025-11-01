export default {
  migrationFolder: 'migrations',
  direction: 'up',
  databaseUrl: process.env.DATABASE_URL,
  createSchema: true,
  logFileName: 'migrations.log',
};