import {
  EnrichedExchangeRequest,
  ExchangeRequest,
  Message,
} from '@/lib/types/exchanges';
import { Vinyl } from '@/lib/types/vinyls';

interface SqlClient {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

function mapRowToEnrichedRequest(row: Record<string, unknown>): EnrichedExchangeRequest {
  return {
    id: row.id as number,
    status: row.status as EnrichedExchangeRequest['status'],
    vinyl_a: row.vinyl_a as number,
    vinyl_b: row.vinyl_b as number,
    vinylA: {
      id: row.va_id as number,
      title: row.va_title as string,
      artist: row.va_artist as string,
      description: row.va_description as string | undefined,
      file_url: row.va_file_url as string | undefined,
      user_id: row.va_user_id as number,
      available: row.va_available as boolean,
      genre: row.va_genre as string | undefined,
    } satisfies Vinyl,
    vinylB: {
      id: row.vb_id as number,
      title: row.vb_title as string,
      artist: row.vb_artist as string,
      description: row.vb_description as string | undefined,
      file_url: row.vb_file_url as string | undefined,
      user_id: row.vb_user_id as number,
      available: row.vb_available as boolean,
      genre: row.vb_genre as string | undefined,
    } satisfies Vinyl,
    userA: {
      id: row.ua_id as number,
      name: row.ua_name as string,
    },
    userB: {
      id: row.ub_id as number,
      name: row.ub_name as string,
    },
  };
}

export class NegotiationQueryService {
  constructor(private readonly sql: SqlClient) {}

  /**
   * Retourne une demande d'échange par son identifiant.
   */
  async getExchangeById(requestId: number): Promise<ExchangeRequest[]> {
    const rows = await this.sql.query(
      'SELECT * FROM requests WHERE id = $1',
      [requestId]
    );
    return rows as unknown as ExchangeRequest[];
  }

  /**
   * Retourne les demandes envoyées par un utilisateur
   * (demandes dont le vinyle A lui appartient).
   */
  async getExchangesBySender(userId: number): Promise<ExchangeRequest[]> {
    const rows = await this.sql.query(
      `SELECT DISTINCT r.*
       FROM requests r
       JOIN vinyls v ON v.id = r.vinyl_a
       WHERE v.user_id = $1`,
      [userId]
    );
    return rows as unknown as ExchangeRequest[];
  }

  /**
   * Retourne les demandes reçues par un utilisateur
   * (demandes dont le vinyle B lui appartient).
   */
  async getExchangesByReceiver(userId: number): Promise<ExchangeRequest[]> {
    const rows = await this.sql.query(
      `SELECT DISTINCT r.*
       FROM requests r
       JOIN vinyls v ON v.id = r.vinyl_b
       WHERE v.user_id = $1`,
      [userId]
    );
    return rows as unknown as ExchangeRequest[];
  }

  /**
   * Retourne toutes les demandes impliquant un vinyle donné.
   */
  async getExchangesByVinyl(vinylId: number): Promise<ExchangeRequest[]> {
    const rows = await this.sql.query(
      'SELECT * FROM requests WHERE vinyl_a = $1 OR vinyl_b = $1',
      [vinylId]
    );
    return rows as unknown as ExchangeRequest[];
  }

  /**
   * Retourne l'historique des messages d'une demande.
   */
  async getMessageHistory(requestId: number): Promise<Message[]> {
    const rows = await this.sql.query(
      'SELECT * FROM messages WHERE request_id = $1',
      [requestId]
    );
    return rows as unknown as Message[];
  }

  /**
   * Retourne en une seule requête SQL toutes les demandes d'échange
   * impliquant l'utilisateur, enrichies des vinyles et utilisateurs associés,
   * séparées entre envoyées (sender = propriétaire de vinyl_a)
   * et reçues (receiver = propriétaire de vinyl_b).
   *
   * Évite les N+1 requêtes qui se produisaient côté client en chaînant
   * GET /api/vinyls/:id et GET /api/users/:id pour chaque demande.
   */
  async getEnrichedExchangesForUser(userId: number): Promise<{
    sentRequests: EnrichedExchangeRequest[];
    receivedRequests: EnrichedExchangeRequest[];
  }> {
    const rows = await this.sql.query(
      `SELECT
         r.id, r.status, r.vinyl_a, r.vinyl_b,
         va.id AS va_id, va.title AS va_title, va.artist AS va_artist,
         va.description AS va_description, va.file_url AS va_file_url,
         va.user_id AS va_user_id, va.available AS va_available, va.genre AS va_genre,
         vb.id AS vb_id, vb.title AS vb_title, vb.artist AS vb_artist,
         vb.description AS vb_description, vb.file_url AS vb_file_url,
         vb.user_id AS vb_user_id, vb.available AS vb_available, vb.genre AS vb_genre,
         ua.id AS ua_id, ua.name AS ua_name,
         ub.id AS ub_id, ub.name AS ub_name
       FROM requests r
       JOIN vinyls va ON va.id = r.vinyl_a
       JOIN vinyls vb ON vb.id = r.vinyl_b
       JOIN users ua ON ua.id = va.user_id
       JOIN users ub ON ub.id = vb.user_id
       WHERE va.user_id = $1 OR vb.user_id = $1`,
      [userId]
    );

    const sentRequests: EnrichedExchangeRequest[] = [];
    const receivedRequests: EnrichedExchangeRequest[] = [];

    for (const row of rows) {
      const enriched = mapRowToEnrichedRequest(row);
      if (enriched.vinylA.user_id === userId) {
        sentRequests.push(enriched);
      } else {
        receivedRequests.push(enriched);
      }
    }

    return { sentRequests, receivedRequests };
  }
}
