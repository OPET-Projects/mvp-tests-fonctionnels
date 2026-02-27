import { connection } from '@/services/DbConnector';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/messages
 *
 * Crée un message associé à une demande (request).
 *
 * @param {NextRequest} request - Requête HTTP Next.js (JSON attendu).
 *
 * @returns {Promise<NextResponse>}
 * - 200: `{ status: 200 }` si l'insertion a réussi
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // Body JSON
 * // {
 * //   "content": "Salut !",
 * //   "user_id": 3,
 * //   "request_id": 12
 * // }
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    const now = new Date();
    try {
        await sql.query('INSERT INTO messages (content, user_id, request_id, created_at) VALUES ($1, $2, $3, $4)', [body.content, body.user_id, body.request_id, now]);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}