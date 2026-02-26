import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: number } }) {
    const { id } = params;
    const sql = await connection();
    try {
        const vinyl = await sql.query('SELECT * FROM vinyls WHERE id = $1', [id]);
        return NextResponse.json(vinyl, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}