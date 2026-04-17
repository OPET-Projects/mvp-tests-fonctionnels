import { connection } from '@/services/DbConnector';
import { NextRequest, NextResponse } from 'next/server';
import { NegotiationCommandService } from '@/services/NegotiationCommandService';

/**
 * POST /api/messages
 *
 * Crée un message associé à une demande (request).
 *
 * @returns {Promise<NextResponse>}
 * - 200: `{ status: 200 }` si l'insertion a réussi
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // Body JSON
 * // { "content": "Salut !", "user_id": 3, "request_id": 12 }
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    const commands = new NegotiationCommandService(sql);
    try {
        await commands.sendMessage(body.request_id, body.user_id, body.content);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
