import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    console.log('id:', id, typeof id);
    const sql = await connection();
    try {
        const vinyls = await sql.query('SELECT * FROM vinyls WHERE user_id = $1', [parseInt(id)]);
        return NextResponse.json(vinyls, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}