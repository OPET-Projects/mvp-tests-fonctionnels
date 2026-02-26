import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';

export async function PUT(request: NextRequest, context: any) {
    const body = await context.body;
    const { id } = await context.params;
    const sql = await connection();
    try {
        await sql.query('UPDATE requests SET status = $1 WHERE id = $2', [body.status, id]);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
    try {
        if (body.status === 'ACCEPTED') {
            await sql.query(
                'UPDATE Vinyls\n' +
                'SET available = false\n' +
                'WHERE id IN (\n' +
                'SELECT vinyl_a FROM Request WHERE id = $1\n' +
                'UNION\n' +
                'SELECT vinyl_b FROM Request WHERE id = $1\n' +
                ')', id);
        }
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}