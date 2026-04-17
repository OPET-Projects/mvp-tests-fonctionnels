import { connection } from "@/services/DbConnector"
import { UserQueryService } from '@/services/UserQueryService'
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
 * - 200: utilisateur
 * - 404: `{ error: "not found" }` si l'utilisateur n'existe pas
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/users/3
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    const queries = new UserQueryService(sql);
    try {
        const [user] = await queries.getUserById(parseInt(id));
        if (!user) {
            return NextResponse.json({ error: 'not found' }, { status: 404 });
        }
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}