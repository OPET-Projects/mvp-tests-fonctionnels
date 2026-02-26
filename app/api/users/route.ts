import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    try {
        const user = await sql.query('SELECT name FROM users WHERE code = $1', [body.code])
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
