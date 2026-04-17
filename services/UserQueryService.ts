import { User } from '@/lib/types/user';

interface SqlClient {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

export class UserQueryService {
  constructor(private readonly sql: SqlClient) {}

  /**
   * Retourne un utilisateur par son code de connexion.
   */
  async getUserByCode(code: string): Promise<User[]> {
    const rows = await this.sql.query(
      'SELECT * FROM users WHERE code = $1',
      [code]
    );
    return rows as unknown as User[];
  }

  /**
   * Retourne un utilisateur par son identifiant.
   */
  async getUserById(userId: number): Promise<User[]> {
    const rows = await this.sql.query(
      'SELECT id, name FROM users WHERE id = $1',
      [userId]
    );
    return rows as unknown as User[];
  }
}
