import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/vinyls
 *
 * Liste les vinyles disponibles n'appartenant pas à l'utilisateur fourni.
 *
 * @param {NextRequest} request - Requête HTTP Next.js (JSON attendu).
 *
 * @returns {Promise<NextResponse>}
 * - 200: liste de vinyles (résultat SQL)
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // Body JSON
 * // { "id": 3 }
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    try {
        const vinyls = await sql.query('SELECT * FROM vinyls WHERE user_id <> $1 AND available = true', [body.id]);
        return NextResponse.json(vinyls, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
