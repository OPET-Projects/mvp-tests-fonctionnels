import { RequestStatus } from '@/lib/enums/RequestStatus';

interface SqlClient {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

export class NegotiationCommandService {
  constructor(private readonly sql: SqlClient) {}

  /**
   * Crée une demande d'échange (INSERT dans requests).
   * vinylA = vinyle proposé par l'expéditeur
   * vinylB = vinyle convoité chez le destinataire
   */
  async proposeExchange(vinylA: number, vinylB: number): Promise<void> {
    await this.sql.query(
      'INSERT INTO requests (status, vinyl_a, vinyl_b) VALUES ($1, $2, $3)',
      [RequestStatus.PENDING, vinylA, vinylB]
    );
  }

  /**
   * Envoie un message associé à une demande.
   */
  async sendMessage(requestId: number, userId: number, content: string): Promise<void> {
    await this.sql.query(
      'INSERT INTO messages (content, user_id, request_id, created_at) VALUES ($1, $2, $3, $4)',
      [content, userId, requestId, new Date()]
    );
  }

  /**
   * Accepte un échange :
   * 1. Met à jour le statut de la demande à ACCEPTED
   * 2. Marque les deux vinyles comme indisponibles
   */
  async acceptExchange(requestId: number): Promise<void> {
    await this.sql.query(
      'UPDATE requests SET status = $1 WHERE id = $2',
      [RequestStatus.ACCEPTED, requestId]
    );
    await this.sql.query(
      `UPDATE vinyls
       SET available = false
       WHERE id IN (
         SELECT vinyl_a FROM requests WHERE id = $1
         UNION
         SELECT vinyl_b FROM requests WHERE id = $1
       )`,
      [requestId]
    );
  }

  /**
   * Refuse un échange : met à jour le statut à REJECTED.
   */
  async rejectExchange(requestId: number): Promise<void> {
    await this.sql.query(
      'UPDATE requests SET status = $1 WHERE id = $2',
      [RequestStatus.REJECTED, requestId]
    );
  }
}
