import { NextRequest, NextResponse } from 'next/server';
import { connection } from '@/services/DbConnector';
import { NegotiationQueryService } from '@/services/NegotiationQueryService';

/**
 * GET /api/requests/enriched/:userId
 *
 * Retourne en un seul appel toutes les demandes d'échange impliquant
 * l'utilisateur, enrichies des vinyles et utilisateurs associés,
 * séparées entre demandes envoyées et demandes reçues.
 *
 * Remplace la série d'appels côté client
 * (GET /api/requests/sender/:id, GET /api/requests/receiver/:id,
 *  puis GET /api/vinyls/:id × 2N, GET /api/users/:id × 2N).
 *
 * @returns {Promise<NextResponse>}
 * - 200: `{ sentRequests, receivedRequests }` (listes d'EnrichedExchangeRequest)
 * - 500: `{ detail: "request failed" }` si erreur serveur/DB
 *
 * @example
 * // GET /api/requests/enriched/3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const sql = await connection();
  const queries = new NegotiationQueryService(sql);
  try {
    const result = await queries.getEnrichedExchangesForUser(parseInt(userId));
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ detail: 'request failed' }, { status: 500 });
  }
}
