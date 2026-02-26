import { neon } from '@neondatabase/serverless';

export async function connection() {
  'use server';
    // Connect to the Neon database
    return neon(`${process.env.DATABASE_URL}`);
}