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

// ---------------------------------------------------------------------------

describe('getEnrichedExchangesForUser', () => {
  // Lignes brutes renvoyées par la requête SQL à JOINs
  // (un userId = 1, qui a envoyé REQUEST_A (vinyl_a.user_id = 1) et reçu REQUEST_B (vinyl_b.user_id = 1))
  const ROW_SENT = {
    id: 1, status: RequestStatus.PENDING, vinyl_a: 5, vinyl_b: 10,
    va_id: 5, va_title: 'Abbey Road', va_artist: 'The Beatles', va_description: '',
    va_file_url: null, va_user_id: 1, va_available: true, va_genre: 'Rock',
    vb_id: 10, vb_title: 'Kind of Blue', vb_artist: 'Miles Davis', vb_description: '',
    vb_file_url: null, vb_user_id: 2, vb_available: true, vb_genre: 'Jazz',
    ua_id: 1, ua_name: 'Alice',
    ub_id: 2, ub_name: 'Bob',
  };
  const ROW_RECEIVED = {
    id: 2, status: RequestStatus.ACCEPTED, vinyl_a: 20, vinyl_b: 30,
    va_id: 20, va_title: 'Thriller', va_artist: 'Michael Jackson', va_description: '',
    va_file_url: null, va_user_id: 3, va_available: false, va_genre: 'Pop',
    vb_id: 30, vb_title: 'Rumours', vb_artist: 'Fleetwood Mac', vb_description: '',
    vb_file_url: null, vb_user_id: 1, vb_available: false, vb_genre: 'Rock',
    ua_id: 3, ua_name: 'Charlie',
    ub_id: 1, ub_name: 'Alice',
  };

  it('exécute un seul appel SQL joignant vinyls et users', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getEnrichedExchangesForUser(1);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/JOIN\s+vinyls/i);
    expect(sql).toMatch(/JOIN\s+users/i);
  });

  it('filtre les demandes où l\'utilisateur est sender OU receiver', async () => {
    mockQuery.mockResolvedValue([]);

    await service.getEnrichedExchangesForUser(7);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/OR/i);
    expect(params).toEqual([7]);
  });

  it('classe une demande en "sent" si l\'utilisateur est propriétaire de vinyl_a', async () => {
    mockQuery.mockResolvedValue([ROW_SENT]);

    const result = await service.getEnrichedExchangesForUser(1);

    expect(result.sentRequests).toHaveLength(1);
    expect(result.receivedRequests).toHaveLength(0);
    expect(result.sentRequests[0].id).toBe(1);
  });

  it('classe une demande en "received" si l\'utilisateur est propriétaire de vinyl_b', async () => {
    mockQuery.mockResolvedValue([ROW_RECEIVED]);

    const result = await service.getEnrichedExchangesForUser(1);

    expect(result.sentRequests).toHaveLength(0);
    expect(result.receivedRequests).toHaveLength(1);
    expect(result.receivedRequests[0].id).toBe(2);
  });

  it('sépare correctement sent et received en un seul passage', async () => {
    mockQuery.mockResolvedValue([ROW_SENT, ROW_RECEIVED]);

    const result = await service.getEnrichedExchangesForUser(1);

    expect(result.sentRequests).toHaveLength(1);
    expect(result.receivedRequests).toHaveLength(1);
  });

  it('mappe correctement vinylA, vinylB, userA, userB depuis les colonnes aliasées', async () => {
    mockQuery.mockResolvedValue([ROW_SENT]);

    const result = await service.getEnrichedExchangesForUser(1);
    const enriched = result.sentRequests[0];

    expect(enriched.vinylA).toMatchObject({ id: 5, title: 'Abbey Road', user_id: 1 });
    expect(enriched.vinylB).toMatchObject({ id: 10, title: 'Kind of Blue', user_id: 2 });
    expect(enriched.userA).toEqual({ id: 1, name: 'Alice' });
    expect(enriched.userB).toEqual({ id: 2, name: 'Bob' });
  });

  it('retourne des listes vides si aucune demande n\'existe', async () => {
    mockQuery.mockResolvedValue([]);

    const result = await service.getEnrichedExchangesForUser(1);

    expect(result).toEqual({ sentRequests: [], receivedRequests: [] });
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.getEnrichedExchangesForUser(1)).rejects.toThrow('DB failure');
  });
});
