import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';
import { RequestStatus } from "@/lib/enums/RequestStatus";

/**
 * POST /api/requests
 *
 * Crée une demande d'échange entre deux vinyles.
 * Le statut est initialisé côté serveur à `PENDING`.
 *
 * @param {NextRequest} request - Requête HTTP Next.js (JSON attendu).
 *
 * @returns {Promise<NextResponse>}
 * - 200: `{ status: 200 }` si la création a réussi
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // Body JSON
 * // {
 * //   "vinyl_a": 10,
 * //   "vinyl_b": 42
 * // }
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const sql = await connection();
    try {
        await sql.query('INSERT INTO requests (status, vinyl_a, vinyl_b) VALUES ($1, $2, $3)', [RequestStatus.PENDING, body.vinyl_a, body.vinyl_b]);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}