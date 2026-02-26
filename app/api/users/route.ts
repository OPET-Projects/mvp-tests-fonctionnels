import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, context: any) {
    const body = context.body;
    const sql = connection();
    try {
        const user = await sql.query('SELECT name INTO users WHERE code = $1', [body.code])
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
