import { connection } from '@/services/DbConnector';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/messages/:request_id
 *
 * Retourne tous les messages liés à une demande (request).
 *
 * @param {NextRequest} request - Requête HTTP Next.js.
 * @param {{ params: Promise<{ request_id: string }> }} context - Contexte Next.js contenant les paramètres de route.
 *
 * @returns {Promise<NextResponse>}
 * - 200: liste de messages (résultat SQL)
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/messages/12
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ request_id: string }> }) {
    const { request_id } = await params;
    const sql = await connection();
    try {
        const messages = await sql.query('SELECT * FROM messages WHERE request_id = $1', [parseInt(request_id)]);
        return NextResponse.json(messages, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}