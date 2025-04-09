import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

// Get the next migration number
function getNextMigrationNumber() {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => parseInt(f.split('_')[0]))
    .filter(n => !isNaN(n));

  const maxNumber = Math.max(0, ...files);
  return String(maxNumber + 1).padStart(3, '0');
}

// Create a new migration file
function createMigration(name) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const number = getNextMigrationNumber();
  const filename = `${number}_${name}.sql`;
  const filepath = path.join(migrationsDir, filename);

  const content = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- Up migration
BEGIN;

-- Your SQL here

COMMIT;

-- Down migration (optional)
-- BEGIN;
-- Your rollback SQL here
-- COMMIT;
`;

  fs.writeFileSync(filepath, content);
  console.log(`Created migration: ${filename}`);
}

// Get migration name from command line
const name = process.argv[2];
if (!name) {
  console.error('Please provide a migration name');
  console.error('Usage: npm run migrate:create <migration-name>');
  process.exit(1);
}

createMigration(name); 