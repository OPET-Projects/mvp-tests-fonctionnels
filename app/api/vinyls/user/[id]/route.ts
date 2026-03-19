import { connection } from '@/services/DbConnector'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/vinyls/user/:id
 *
 * Liste tous les vinyles appartenant à un utilisateur.
 *
 * @param {NextRequest} request - Requête HTTP Next.js.
 * @param {{ params: Promise<{ id: string }> }} context - Contexte Next.js contenant les paramètres de route.
 *
 * @returns {Promise<NextResponse>}
 * - 200: liste de vinyles (résultat SQL)
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/vinyls/user/3
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    try {
        const vinyls = await sql.query('SELECT * FROM vinyls WHERE user_id = $1', [parseInt(id)]);
        return NextResponse.json(vinyls, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}