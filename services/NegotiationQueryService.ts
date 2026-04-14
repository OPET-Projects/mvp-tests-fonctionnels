import { ExchangeRequest, Message } from '@/lib/types/exchanges';

interface SqlClient {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
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
}
