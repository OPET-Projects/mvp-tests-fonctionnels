import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    try {
        const vinyls = await sql.query('SELECT * FROM vinyls WHERE user_id <> $1 AND available = true', [body.id]);
        return NextResponse.json(vinyls, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
