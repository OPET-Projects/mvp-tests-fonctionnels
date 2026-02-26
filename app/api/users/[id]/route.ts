import { connection } from "@/services/DbConnector"
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: number } }) {
    const { id } = params;
    const sql = await connection();
    try {
        const user = await sql.query('SELECT * INTO user WHERE id = $1', [id]);
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}