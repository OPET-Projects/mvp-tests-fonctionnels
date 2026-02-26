import { connection } from '@/services/DbConnector';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: any) {
    const { request_id } = await context.params;
    const sql = await connection();
    try {
        const messages = await sql.query('SELECT * INTO messages WHERE request_id = $1', request_id);
        return NextResponse.json(messages, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}