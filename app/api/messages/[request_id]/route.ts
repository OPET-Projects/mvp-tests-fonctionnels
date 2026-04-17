import { connection } from '@/services/DbConnector';
import { NextRequest, NextResponse } from 'next/server';
import { NegotiationQueryService } from '@/services/NegotiationQueryService';

/**
 * GET /api/messages/:request_id
 *
 * Retourne tous les messages liés à une demande (request).
 *
 * @returns {Promise<NextResponse>}
 * - 200: liste de messages
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/messages/12
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ request_id: string }> }) {
    const { request_id } = await params;
    const sql = await connection();
    const queries = new NegotiationQueryService(sql);
    try {
        const messages = await queries.getMessageHistory(parseInt(request_id));
        return NextResponse.json(messages, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
