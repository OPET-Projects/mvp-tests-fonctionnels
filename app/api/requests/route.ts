import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';
import { RequestStatus } from "@/lib/enums/RequestStatus";

export async function POST(request: NextRequest, context: any) {
    const body = context.body;
    const sql = await connection();
    try {
        await sql.query('INSERT INTO requests (status, vinyl_a, vinyl_b) VALUES ($1, $2, $3)', [RequestStatus.ACCEPTED, body.vinyl_a, body.vinyl_b]);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}