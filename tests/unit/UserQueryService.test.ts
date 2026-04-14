import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserQueryService } from '@/services/UserQueryService';

const mockQuery = vi.fn();
const mockSql = { query: mockQuery };

let service: UserQueryService;

const USER_A = { id: 1, name: 'Alice', code: 'ALICE123' };
const USER_B = { id: 2, name: 'Bob',   code: 'BOB4567'  };

beforeEach(() => {
  vi.clearAllMocks();
  service = new UserQueryService(mockSql);
});

// ---------------------------------------------------------------------------

describe('getUserByCode', () => {
  it('filtre par code avec le bon paramètre', async () => {
    mockQuery.mockResolvedValue([USER_A]);

    await service.getUserByCode('ALICE123');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/WHERE\s+code\s*=\s*\$1/i);
    expect(params).toEqual(['ALICE123']);
  });

  it('retourne l\'utilisateur correspondant au code', async () => {
    mockQuery.mockResolvedValue([USER_A]);

    const result = await service.getUserByCode('ALICE123');

    expect(result).toEqual([USER_A]);
  });

  it('retourne un tableau vide si le code est inconnu', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getUserByCode('INCONNU');

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getUserByCode('ALICE123')).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('getUserById', () => {
  it('interroge la table users avec le bon id en paramètre', async () => {
    mockQuery.mockResolvedValue([USER_A]);

    await service.getUserById(1);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/FROM\s+users/i);
    expect(sql).toContain('$1');
    expect(params).toEqual([1]);
  });

  it('sélectionne uniquement id et name (pas le code)', async () => {
    mockQuery.mockResolvedValue([{ id: 1, name: 'Alice' }]);

    await service.getUserById(1);

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/SELECT\s+id,\s*name/i);
    expect(sql).not.toMatch(/SELECT\s+\*/);
  });

  it('retourne l\'utilisateur correspondant', async () => {
    mockQuery.mockResolvedValue([USER_A]);

    const result = await service.getUserById(1);

    expect(result).toEqual([USER_A]);
  });

  it('retourne un tableau vide si l\'utilisateur n\'existe pas', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getUserById(999);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getUserById(1)).rejects.toThrow('DB failure');
  });
});
