import { connection } from "@/services/DbConnector"
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/users/:id
 *
 * Retourne un utilisateur par identifiant.
 *
 * @param {NextRequest} request - Requête HTTP Next.js.
 * @param {{ params: Promise<{ id: string }> }} context - Contexte Next.js contenant les paramètres de route.
 *
 * @returns {Promise<NextResponse>}
 * - 200: utilisateur (résultat SQL)
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/users/3
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    try {
        const user = await sql.query('SELECT id, name FROM users WHERE id = $1', [parseInt(id)]);
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}