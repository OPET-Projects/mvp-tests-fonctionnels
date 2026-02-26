import {NextRequest, NextResponse} from "next/server";
import {connection} from '@/app/services/DbConnector';
import {RequestStatus} from "@/app/enums/RequestStatus";

export async function POST(request: NextRequest, context: any) {
    const body = context.body;
    const sql = connection();
    try {
    await sql.query('INSERT INTO requests (status, vinyl_a, vinyl_b) VALUES ($1, $2, $3)', [RequestStatus.ACCEPTED, body.vinyl_a, body.vinyl_b]);
    return NextResponse.json({status: 200});
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}