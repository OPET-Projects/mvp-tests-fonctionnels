import { connection } from '@/services/DbConnector'
import { UserQueryService } from '@/services/UserQueryService'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/users
 *
 * Récupère un utilisateur à partir d'un code de connexion.
 *
 * @param {NextRequest} request - Requête HTTP Next.js (JSON attendu).
 *
 * @returns {Promise<NextResponse>}
 * - 200: utilisateur correspondant au code
 * - 404: `{ error: "not found" }` si aucun utilisateur ne correspond
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // Body JSON
 * // { "code": "ABCD1234" }
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    const queries = new UserQueryService(sql);
    try {
        const [user] = await queries.getUserByCode(body.code);
        if (!user) {
            return NextResponse.json({ error: 'not found' }, { status: 404 });
        }
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
