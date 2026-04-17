import { NextRequest, NextResponse } from "next/server";
import { connection } from '@/services/DbConnector';
import { NegotiationCommandService } from "@/services/NegotiationCommandService";
import { NegotiationQueryService } from "@/services/NegotiationQueryService";
import { RequestStatus } from "@/lib/enums/RequestStatus";

/**
 * GET /api/requests/:id
 *
 * Retourne une demande d'échange par identifiant.
 *
 * @returns {Promise<NextResponse>}
 * - 200: demande
 * - 404: `{ error: "not found" }` si la demande n'existe pas
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sql = await connection();
    const queries = new NegotiationQueryService(sql);
    try {
        const [result] = await queries.getExchangeById(parseInt(id));
        if (!result) {
            return NextResponse.json({ error: 'not found' }, { status: 404 });
        }
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
 * Si le statut devient `"ACCEPTED"`, marque les deux vinyles comme indisponibles.
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
    const commands = new NegotiationCommandService(sql);
    try {
        if (body.status === RequestStatus.ACCEPTED) {
            await commands.acceptExchange(parseInt(id));
        } else if (body.status === RequestStatus.REJECTED) {
            await commands.rejectExchange(parseInt(id));
        }
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ detail: 'request failed' }, { status: 500 });
    }
}
