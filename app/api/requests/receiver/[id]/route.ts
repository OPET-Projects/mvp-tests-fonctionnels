import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const sql = await connection();
    try {
        const requests = await sql.query(
            'SELECT DISTINCT r.*\n' +
            'FROM Request r\n' +
            'JOIN Vinyls v ON v.id = r.vinyl_b\n' +
            'WHERE v.user_id = $1;',
            [parseInt(id)]);
        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}