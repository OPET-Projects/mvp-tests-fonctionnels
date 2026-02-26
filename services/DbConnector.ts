import { neon } from '@neondatabase/serverless';

export function connection() {
  'use server';
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    return sql;
}