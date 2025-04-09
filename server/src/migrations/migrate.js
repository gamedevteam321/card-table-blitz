import { supabaseAdmin } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  const { error } = await supabaseAdmin.rpc('create_migrations_table');
  if (error) {
    console.error('Error creating migrations table:', error);
    process.exit(1);
  }
}

// Get list of applied migrations
async function getAppliedMigrations() {
  const { data, error } = await supabaseAdmin
    .from('migrations')
    .select('name')
    .order('applied_at', { ascending: true });

  if (error) {
    console.error('Error getting applied migrations:', error);
    process.exit(1);
  }

  return data.map(m => m.name);
}

// Apply a migration
async function applyMigration(name, sql) {
  console.log(`Applying migration: ${name}`);

  try {
    // Start transaction
    const { error: beginError } = await supabaseAdmin.rpc('begin_transaction');
    if (beginError) throw beginError;

    // Execute migration SQL
    const { error: sqlError } = await supabaseAdmin.rpc('execute_sql', { sql });
    if (sqlError) throw sqlError;

    // Record migration
    const { error: recordError } = await supabaseAdmin
      .from('migrations')
      .insert([{ name, applied_at: new Date().toISOString() }]);
    if (recordError) throw recordError;

    // Commit transaction
    const { error: commitError } = await supabaseAdmin.rpc('commit_transaction');
    if (commitError) throw commitError;

    console.log(`Successfully applied migration: ${name}`);
  } catch (error) {
    // Rollback transaction
    await supabaseAdmin.rpc('rollback_transaction');
    console.error(`Error applying migration ${name}:`, error);
    process.exit(1);
  }
}

// Run migrations
async function runMigrations() {
  try {
    await ensureMigrationsTable();
    const appliedMigrations = await getAppliedMigrations();

    // Get migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (!appliedMigrations.includes(file)) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await applyMigration(file, sql);
      }
    }

    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
} 