import { connection } from "@/services/DbConnector"
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const sql = await connection();
    try {
        const user = await sql.query('SELECT * FROM user WHERE id = $1', [parseInt(id)]);
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}