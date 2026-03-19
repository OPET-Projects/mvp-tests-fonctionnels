import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';

/**
 * GET /api/requests/receiver/:id
 *
 * Liste les demandes "reçues" par un utilisateur :
 * demandes dont le vinyle B appartient à l'utilisateur `id`.
 *
 * @param {NextRequest} request - Requête HTTP Next.js.
 * @param {{ params: Promise<{ id: string }> }} context - Contexte Next.js contenant les paramètres de route.
 *
 * @returns {Promise<NextResponse>}
 * - 200: liste de requests (résultat SQL)
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/requests/receiver/3
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    try {
        const requests = await sql.query(
            'SELECT DISTINCT r.*\n' +
            'FROM Requests r\n' +
            'JOIN Vinyls v ON v.id = r.vinyl_b\n' +
            'WHERE v.user_id = $1;',
            [parseInt(id)]);
        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}