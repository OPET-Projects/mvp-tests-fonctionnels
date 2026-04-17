import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VinylQueryService } from '@/services/VinylQueryService';

const mockQuery = vi.fn();
const mockSql = { query: mockQuery };

let service: VinylQueryService;

const VINYL_A = { id: 1, title: 'Dark Side of the Moon', artist: 'Pink Floyd', user_id: 2, available: true };
const VINYL_B = { id: 2, title: 'Abbey Road', artist: 'The Beatles', user_id: 3, available: true };

beforeEach(() => {
  vi.clearAllMocks();
  service = new VinylQueryService(mockSql);
});

// ---------------------------------------------------------------------------

describe('getAvailableVinyls', () => {
  it('exclut les vinyles de l\'utilisateur et filtre sur available = true', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getAvailableVinyls(1);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/user_id\s*<>/i);
    expect(sql).toMatch(/available\s*=\s*true/i);
    expect(params).toEqual([1]);
  });

  it('retourne tous les vinyles disponibles', async () => {
    mockQuery.mockResolvedValue([VINYL_A, VINYL_B]);

    const result = await service.getAvailableVinyls(5);

    expect(result).toHaveLength(2);
    expect(result).toEqual([VINYL_A, VINYL_B]);
  });

  it('retourne un tableau vide s\'il n\'y a rien de disponible', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getAvailableVinyls(1);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getAvailableVinyls(1)).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('getVinylsByUser', () => {
  it('filtre par user_id avec le bon paramètre', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getVinylsByUser(3);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/user_id\s*=\s*\$1/i);
    expect(params).toEqual([3]);
  });

  it('retourne tous les vinyles de l\'utilisateur — pas seulement le premier', async () => {
    mockQuery.mockResolvedValue([VINYL_A, VINYL_B]);

    const result = await service.getVinylsByUser(2);

    expect(result).toHaveLength(2);
    expect(result).toEqual([VINYL_A, VINYL_B]);
  });

  it('retourne un tableau vide si l\'utilisateur n\'a pas de vinyles', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getVinylsByUser(99);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getVinylsByUser(3)).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('getVinylById', () => {
  it('interroge la table vinyls avec le bon id en paramètre', async () => {
    mockQuery.mockResolvedValue([VINYL_A]);

    await service.getVinylById(1);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/FROM\s+vinyls/i);
    expect(sql).toContain('$1');
    expect(params).toEqual([1]);
  });

  it('retourne le vinyle correspondant', async () => {
    mockQuery.mockResolvedValue([VINYL_A]);

    const result = await service.getVinylById(1);

    expect(result).toEqual([VINYL_A]);
  });

  it('retourne un tableau vide si le vinyle n\'existe pas', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getVinylById(999);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getVinylById(1)).rejects.toThrow('DB failure');
  });
});
