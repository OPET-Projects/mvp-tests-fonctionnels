import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';

/**
 * GET /api/requests/:id
 *
 * Retourne une demande d'échange par identifiant.
 *
 * @returns {Promise<NextResponse>}
 * - 200: demande (résultat SQL)
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    try {
        const result = await sql.query('SELECT * FROM requests WHERE id = $1', [parseInt(id)]);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}

/**
 * PUT /api/requests/:id
 *
 * Met à jour le statut d'une demande.
 * Si le statut devient `"ACCEPTED"`, la route marque comme indisponibles
 * les deux vinyles associés à la demande.
 *
 * @param {NextRequest} request - Requête HTTP Next.js (JSON attendu).
 * @param {{ params: Promise<{ id: string }> }} context - Contexte Next.js contenant les paramètres de route.
 *
 * @returns {Promise<NextResponse>}
 * - 200: `{ status: 200 }` si la mise à jour a réussi
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // PUT /api/requests/12
 * // Body JSON: { "status": "ACCEPTED" }
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const body = await request.json();
    const { id } = await params;
    const sql = await connection();
    try {
        await sql.query('UPDATE requests SET status = $1 WHERE id = $2', [body.status, parseInt(id)]);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
    try {
        if (body.status === 'ACCEPTED') {
            await sql.query(
                'UPDATE Vinyls\n' +
                'SET available = false\n' +
                'WHERE id IN (\n' +
                'SELECT vinyl_a FROM Requests WHERE id = $1\n' +
                'UNION\n' +
                'SELECT vinyl_b FROM Requests WHERE id = $1\n' +
                ')', [id]);
        }
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}