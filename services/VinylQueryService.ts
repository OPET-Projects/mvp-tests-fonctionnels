import { Vinyl } from '@/lib/types/vinyls';

interface SqlClient {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

export class VinylQueryService {
  constructor(private readonly sql: SqlClient) {}

  /**
   * Retourne les vinyles disponibles n'appartenant pas à l'utilisateur donné.
   */
  async getAvailableVinyls(userId: number): Promise<Vinyl[]> {
    const rows = await this.sql.query(
      'SELECT * FROM vinyls WHERE user_id <> $1 AND available = true',
      [userId]
    );
    return rows as unknown as Vinyl[];
  }

  /**
   * Retourne tous les vinyles d'un utilisateur.
   */
  async getVinylsByUser(userId: number): Promise<Vinyl[]> {
    const rows = await this.sql.query(
      'SELECT * FROM vinyls WHERE user_id = $1',
      [userId]
    );
    return rows as unknown as Vinyl[];
  }

  /**
   * Retourne un vinyle par son identifiant.
   */
  async getVinylById(vinylId: number): Promise<Vinyl[]> {
    const rows = await this.sql.query(
      'SELECT * FROM vinyls WHERE id = $1',
      [vinylId]
    );
    return rows as unknown as Vinyl[];
  }
}
