import { connection } from '@/services/DbConnector';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, context: any) {
    const body = context.body;
    const sql = await connection();
    const now = new Date();
    try {
        await sql.query('INSERT INTO messages (content, user_id, request_id, created_at) VALUES ($1, $2, $3, $4)', [body.content, body.user_id, body.request_id, now]);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}