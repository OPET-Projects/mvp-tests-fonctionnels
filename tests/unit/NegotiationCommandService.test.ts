import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NegotiationCommandService } from '@/services/NegotiationCommandService';
import { RequestStatus } from '@/lib/enums/RequestStatus';

const mockQuery = vi.fn();
const mockSql = { query: mockQuery };

let service: NegotiationCommandService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new NegotiationCommandService(mockSql);
});

// ---------------------------------------------------------------------------

describe('proposeExchange', () => {
  it('émet exactement une query INSERT vers la table requests', async () => {
    mockQuery.mockResolvedValue([]);

    await service.proposeExchange(5, 10);

    expect(mockQuery).toHaveBeenCalledOnce();
    expect(mockQuery.mock.calls[0][0]).toMatch(/INSERT\s+INTO\s+requests/i);
  });

  it('passe le statut PENDING en premier paramètre', async () => {
    mockQuery.mockResolvedValue([]);

    await service.proposeExchange(5, 10);

    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBe(RequestStatus.PENDING);
  });

  it('passe vinylA avant vinylB — ne les inverse pas', async () => {
    mockQuery.mockResolvedValue([]);

    await service.proposeExchange(5, 10);

    const [, params] = mockQuery.mock.calls[0];
    expect(params[1]).toBe(5);   // vinylA
    expect(params[2]).toBe(10);  // vinylB
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.proposeExchange(5, 10)).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('sendMessage', () => {
  it('émet exactement une query INSERT vers la table messages', async () => {
    mockQuery.mockResolvedValue([]);

    await service.sendMessage(42, 1, 'Super proposition !');

    expect(mockQuery).toHaveBeenCalledOnce();
    expect(mockQuery.mock.calls[0][0]).toMatch(/INSERT\s+INTO\s+messages/i);
  });

  it('passe les paramètres dans l\'ordre : content, user_id, request_id, created_at', async () => {
    mockQuery.mockResolvedValue([]);

    await service.sendMessage(42, 1, 'Super proposition !');

    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBe('Super proposition !');
    expect(params[1]).toBe(1);
    expect(params[2]).toBe(42);
    expect(params[3]).toBeInstanceOf(Date);
  });

  it('le created_at est une date correspondant au moment de l\'appel', async () => {
    const avant = new Date();
    mockQuery.mockResolvedValue([]);

    await service.sendMessage(42, 1, 'message');

    const apres = new Date();
    const createdAt: Date = mockQuery.mock.calls[0][1][3];
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(avant.getTime());
    expect(createdAt.getTime()).toBeLessThanOrEqual(apres.getTime());
  });

  it('accepte un contenu vide sans modifier les autres paramètres', async () => {
    mockQuery.mockResolvedValue([]);

    await service.sendMessage(42, 1, '');

    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBe('');
    expect(params[1]).toBe(1);
    expect(params[2]).toBe(42);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.sendMessage(42, 1, 'message')).rejects.toThrow('DB failure');
  });
});

// ---------------------------------------------------------------------------

describe('acceptExchange', () => {
  it('émet exactement 2 queries', async () => {
    mockQuery.mockResolvedValue([]);

    await service.acceptExchange(42);

    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('1ère query : UPDATE requests avec le statut ACCEPTED et le bon id', async () => {
    mockQuery.mockResolvedValue([]);

    await service.acceptExchange(42);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/UPDATE\s+requests/i);
    expect(params[0]).toBe(RequestStatus.ACCEPTED);
    expect(params[1]).toBe(42);
  });

  it('2ème query : UPDATE vinyls avec le même requestId', async () => {
    mockQuery.mockResolvedValue([]);

    await service.acceptExchange(42);

    const [sql, params] = mockQuery.mock.calls[1];
    expect(sql).toMatch(/UPDATE\s+vinyls/i);
    expect(sql).toMatch(/available/i);
    expect(params[0]).toBe(42);
  });

  it('2ème query : cible vinyl_a ET vinyl_b via UNION', async () => {
    mockQuery.mockResolvedValue([]);

    await service.acceptExchange(42);

    const [sql] = mockQuery.mock.calls[1];
    expect(sql).toMatch(/vinyl_a/i);
    expect(sql).toMatch(/vinyl_b/i);
    expect(sql).toMatch(/UNION/i);
  });

  it('si la 1ère query échoue, la 2ème n\'est pas exécutée', async () => {
    mockQuery.mockRejectedValueOnce(new Error('erreur requests'));

    await expect(service.acceptExchange(42)).rejects.toThrow();

    expect(mockQuery).toHaveBeenCalledOnce();
  });

  it('propage l\'erreur de la 1ère query', async () => {
    mockQuery.mockRejectedValueOnce(new Error('erreur requests'));

    await expect(service.acceptExchange(42)).rejects.toThrow('erreur requests');
  });

  it('propage l\'erreur de la 2ème query', async () => {
    mockQuery
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('erreur vinyls'));

    await expect(service.acceptExchange(42)).rejects.toThrow('erreur vinyls');
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------

describe('rejectExchange', () => {
  it('émet exactement une query UPDATE vers la table requests', async () => {
    mockQuery.mockResolvedValue([]);

    await service.rejectExchange(42);

    expect(mockQuery).toHaveBeenCalledOnce();
    expect(mockQuery.mock.calls[0][0]).toMatch(/UPDATE\s+requests/i);
  });

  it('passe le statut REJECTED — pas ACCEPTED', async () => {
    mockQuery.mockResolvedValue([]);

    await service.rejectExchange(42);

    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBe(RequestStatus.REJECTED);
    expect(params[0]).not.toBe(RequestStatus.ACCEPTED);
  });

  it('cible le bon requestId', async () => {
    mockQuery.mockResolvedValue([]);

    await service.rejectExchange(42);

    const [, params] = mockQuery.mock.calls[0];
    expect(params[1]).toBe(42);
  });

  it('propage l\'erreur si la DB échoue', async () => {
    mockQuery.mockRejectedValue(new Error('DB failure'));

    await expect(service.rejectExchange(42)).rejects.toThrow('DB failure');
  });
});
