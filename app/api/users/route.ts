import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/users
 *
 * Récupère (au moins) le nom d'un utilisateur à partir d'un code.
 *
 * @param {NextRequest} request - Requête HTTP Next.js (JSON attendu).
 *
 * @returns {Promise<NextResponse>}
 * - 200: résultat SQL contenant `name` de l'utilisateur
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // Body JSON
 * // { "code": "ABCD1234" }
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    try {
        const user = await sql.query('SELECT * FROM users WHERE code = $1', [body.code])
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
