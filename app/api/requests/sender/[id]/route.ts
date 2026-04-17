import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';
import { NegotiationQueryService } from "@/services/NegotiationQueryService";

/**
 * GET /api/requests/sender/:id
 *
 * Liste les demandes envoyées par un utilisateur
 * (demandes dont le vinyle A lui appartient).
 *
 * @returns {Promise<NextResponse>}
 * - 200: liste de requests
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/requests/sender/3
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    const queries = new NegotiationQueryService(sql);
    try {
        const requests = await queries.getExchangesBySender(parseInt(id));
        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
