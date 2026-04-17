import { connection } from '@/services/DbConnector'
import { VinylQueryService } from '@/services/VinylQueryService'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/vinyls/:id
 *
 * Retourne un vinyle par identifiant.
 *
 * @param {NextRequest} request - Requête HTTP Next.js.
 * @param {{ params: Promise<{ id: string }> }} context - Contexte Next.js contenant les paramètres de route.
 *
 * @returns {Promise<NextResponse>}
 * - 200: vinyle
 * - 404: `{ error: "not found" }` si le vinyle n'existe pas
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/vinyls/42
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    const queries = new VinylQueryService(sql);
    try {
        const [vinyl] = await queries.getVinylById(parseInt(id));
        if (!vinyl) {
            return NextResponse.json({ error: 'not found' }, { status: 404 });
        }
        return NextResponse.json(vinyl, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}