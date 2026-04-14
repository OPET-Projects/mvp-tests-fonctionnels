import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NegotiationQueryService } from '@/services/NegotiationQueryService';
import { RequestStatus } from '@/lib/enums/RequestStatus';

const mockQuery = vi.fn();
const mockSql = { query: mockQuery };

let service: NegotiationQueryService;

const REQUEST_A = { id: 1, status: RequestStatus.PENDING,  vinyl_a: 5,  vinyl_b: 10 };
const REQUEST_B = { id: 2, status: RequestStatus.ACCEPTED, vinyl_a: 7,  vinyl_b: 12 };
const MESSAGE_A = { id: 1, content: 'Intéressé !', user_id: 1, request_id: 42, created_at: '2024-01-01T10:00:00.000Z' };
const MESSAGE_B = { id: 2, content: 'Ok super.',   user_id: 2, request_id: 42, created_at: '2024-01-01T10:05:00.000Z' };

beforeEach(() => {
  vi.clearAllMocks();
  service = new NegotiationQueryService(mockSql);
});

// ---------------------------------------------------------------------------

describe('getExchangeById', () => {
  it('interroge la table requests avec le bon id en paramètre', async () => {
    mockQuery.mockResolvedValue([REQUEST_A]);

    await service.getExchangeById(1);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/FROM\s+requests/i);
    expect(sql).toContain('$1');
    expect(params).toEqual([1]);
  });

  it('retourne la demande correspondante', async () => {
    mockQuery.mockResolvedValue([REQUEST_A]);

    const result = await service.getExchangeById(1);

    expect(result).toEqual([REQUEST_A]);
  });

  it('retourne un tableau vide si aucune demande trouvée', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getExchangeById(999);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getExchangeById(1)).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('getExchangesBySender', () => {
  it('joint vinyls sur vinyl_a pour identifier l\'expéditeur', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getExchangesBySender(1);

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/JOIN\s+vinyls/i);
    expect(sql).toMatch(/vinyl_a/i);
  });

  it('filtre par user_id avec le bon paramètre', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getExchangesBySender(7);

    const [, params] = mockQuery.mock.calls[0];
    expect(params).toEqual([7]);
  });

  it('retourne toutes les demandes envoyées — pas seulement la première', async () => {
    mockQuery.mockResolvedValue([REQUEST_A, REQUEST_B]);

    const result = await service.getExchangesBySender(1);

    expect(result).toHaveLength(2);
    expect(result).toEqual([REQUEST_A, REQUEST_B]);
  });

  it('retourne un tableau vide si l\'utilisateur n\'a rien envoyé', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getExchangesBySender(1);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getExchangesBySender(1)).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('getExchangesByReceiver', () => {
  it('joint vinyls sur vinyl_b pour identifier le destinataire', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getExchangesByReceiver(2);

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/JOIN\s+vinyls/i);
    expect(sql).toMatch(/vinyl_b/i);
  });

  it('ne confond pas receiver (vinyl_b) avec sender (vinyl_a)', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getExchangesByReceiver(2);

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).not.toMatch(/v\.id\s*=\s*r\.vinyl_a/i);
  });

  it('filtre par user_id avec le bon paramètre', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getExchangesByReceiver(7);

    const [, params] = mockQuery.mock.calls[0];
    expect(params).toEqual([7]);
  });

  it('retourne toutes les demandes reçues — pas seulement la première', async () => {
    mockQuery.mockResolvedValue([REQUEST_A, REQUEST_B]);

    const result = await service.getExchangesByReceiver(2);

    expect(result).toHaveLength(2);
    expect(result).toEqual([REQUEST_A, REQUEST_B]);
  });

  it('retourne un tableau vide si l\'utilisateur n\'a rien reçu', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getExchangesByReceiver(2);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getExchangesByReceiver(2)).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('getExchangesByVinyl', () => {
  it('cherche le vinyle aussi bien en vinyl_a qu\'en vinyl_b (condition OR)', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getExchangesByVinyl(5);

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/vinyl_a/i);
    expect(sql).toMatch(/vinyl_b/i);
    expect(sql).toMatch(/OR/i);
  });

  it('passe le vinylId une seule fois en paramètre ($1 réutilisé dans le SQL)', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getExchangesByVinyl(5);

    const [, params] = mockQuery.mock.calls[0];
    expect(params).toEqual([5]);
  });

  it('retourne toutes les demandes impliquant ce vinyle — pas seulement la première', async () => {
    mockQuery.mockResolvedValue([REQUEST_A, REQUEST_B]);

    const result = await service.getExchangesByVinyl(5);

    expect(result).toHaveLength(2);
    expect(result).toEqual([REQUEST_A, REQUEST_B]);
  });

  it('retourne un tableau vide si aucune demande ne concerne ce vinyle', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getExchangesByVinyl(999);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getExchangesByVinyl(5)).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('getMessageHistory', () => {
  it('interroge la table messages avec le bon request_id en paramètre', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getMessageHistory(42);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/FROM\s+messages/i);
    expect(sql).toContain('$1');
    expect(params).toEqual([42]);
  });

  it('retourne les messages d\'une conversation', async () => {
    mockQuery.mockResolvedValue([MESSAGE_A]);

    const result = await service.getMessageHistory(42);

    expect(result).toEqual([MESSAGE_A]);
  });

  it('retourne tous les messages — pas seulement le premier', async () => {
    mockQuery.mockResolvedValue([MESSAGE_A, MESSAGE_B]);

    const result = await service.getMessageHistory(42);

    expect(result).toHaveLength(2);
    expect(result).toEqual([MESSAGE_A, MESSAGE_B]);
  });

  it('retourne un tableau vide s\'il n\'y a pas de messages', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getMessageHistory(42);

    expect(result).toEqual([]);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getMessageHistory(42)).rejects.toThrow('DB failure');
  });
});
