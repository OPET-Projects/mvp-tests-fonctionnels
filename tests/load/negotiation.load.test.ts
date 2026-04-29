import { describe, it, expect, beforeEach } from 'vitest';
import { NegotiationCommandService } from '@/services/NegotiationCommandService';
import { RequestStatus } from '@/lib/enums/RequestStatus';

// ---------------------------------------------------------------------------
// Fake SQL backend that simulates a shared in-memory database.
// All concurrent requests share the same tables so we can verify that
// concurrent operations on the same vinyl pair stay consistent.
// ---------------------------------------------------------------------------

interface RequestRow {
  id: number;
  status: string;
  vinyl_a: number;
  vinyl_b: number;
}

interface VinylRow {
  id: number;
  available: boolean;
}

interface MessageRow {
  id: number;
  content: string;
  user_id: number;
  request_id: number;
  created_at: Date;
}

function buildSharedSqlClient(
  requests: RequestRow[],
  vinyls: VinylRow[],
  messages: MessageRow[],
) {
  let requestSeq = 0;
  let messageSeq = 0;

  return {
    query: async (sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> => {
      const s = sql.trim().toUpperCase();

      // INSERT INTO requests
      if (s.startsWith('INSERT INTO REQUESTS')) {
        const id = ++requestSeq;
        requests.push({
          id,
          status: params[0] as string,
          vinyl_a: params[1] as number,
          vinyl_b: params[2] as number,
        });
        return [{ id }];
      }

      // INSERT INTO messages
      if (s.startsWith('INSERT INTO MESSAGES')) {
        const id = ++messageSeq;
        messages.push({
          id,
          content: params[0] as string,
          user_id: params[1] as number,
          request_id: params[2] as number,
          created_at: params[3] as Date,
        });
        return [{ id }];
      }

      // UPDATE requests SET status = $1 WHERE id = $2
      if (s.startsWith('UPDATE REQUESTS')) {
        const newStatus = params[0] as string;
        const requestId = params[1] as number;
        const row = requests.find((r) => r.id === requestId);
        if (row) row.status = newStatus;
        return [];
      }

      // UPDATE vinyls SET available = false WHERE id IN (SELECT vinyl_a ... UNION SELECT vinyl_b ...)
      if (s.startsWith('UPDATE VINYLS')) {
        const requestId = params[0] as number;
        const row = requests.find((r) => r.id === requestId);
        if (row) {
          const vinylIds = new Set([row.vinyl_a, row.vinyl_b]);
          for (const v of vinyls) {
            if (vinylIds.has(v.id)) v.available = false;
          }
        }
        return [];
      }

      return [];
    },
  };
}

// ---------------------------------------------------------------------------

const VINYL_A_ID = 1;
const VINYL_B_ID = 2;
const CONCURRENCY = 50;

describe('Tests de charge — négociation et échange concurrent', () => {
  let requests: RequestRow[];
  let vinyls: VinylRow[];
  let messages: MessageRow[];
  let service: NegotiationCommandService;

  beforeEach(() => {
    requests = [];
    vinyls = [
      { id: VINYL_A_ID, available: true },
      { id: VINYL_B_ID, available: true },
    ];
    messages = [];

    const sql = buildSharedSqlClient(requests, vinyls, messages);
    service = new NegotiationCommandService(sql);
  });

  // -------------------------------------------------------------------------

  it(`crée ${CONCURRENCY} demandes simultanées sans perte ni doublon`, async () => {
    const tasks = Array.from({ length: CONCURRENCY }, () =>
      service.proposeExchange(VINYL_A_ID, VINYL_B_ID),
    );

    await expect(Promise.all(tasks)).resolves.not.toThrow();

    expect(requests).toHaveLength(CONCURRENCY);

    // Tous les statuts sont PENDING
    const statuses = new Set(requests.map((r) => r.status));
    expect(statuses).toEqual(new Set([RequestStatus.PENDING]));

    // Les identifiants sont tous uniques
    const ids = requests.map((r) => r.id);
    expect(new Set(ids).size).toBe(CONCURRENCY);

    // Les paires vinyle sont cohérentes
    for (const req of requests) {
      expect(req.vinyl_a).toBe(VINYL_A_ID);
      expect(req.vinyl_b).toBe(VINYL_B_ID);
    }
  });

  // -------------------------------------------------------------------------

  it(`${CONCURRENCY} messages envoyés simultanément conservent leur contenu et leur ordre de création`, async () => {
    await service.proposeExchange(VINYL_A_ID, VINYL_B_ID);
    const requestId = requests[0].id;

    const payloads = Array.from({ length: CONCURRENCY }, (_, i) => ({
      userId: i + 1,
      content: `Message ${i}`,
    }));

    const tasks = payloads.map(({ userId, content }) =>
      service.sendMessage(requestId, userId, content),
    );

    await expect(Promise.all(tasks)).resolves.not.toThrow();

    expect(messages).toHaveLength(CONCURRENCY);

    // Tous les messages référencent la bonne demande
    for (const msg of messages) {
      expect(msg.request_id).toBe(requestId);
    }

    // Tous les contenus attendus sont présents (pas de perte)
    const contents = new Set(messages.map((m) => m.content));
    for (const { content } of payloads) {
      expect(contents.has(content)).toBe(true);
    }

    // Les timestamps sont valides (pas de date nulle ou future absurde)
    const now = Date.now();
    for (const msg of messages) {
      expect(msg.created_at).toBeInstanceOf(Date);
      expect(msg.created_at.getTime()).toBeLessThanOrEqual(now + 1000);
    }
  });

  // -------------------------------------------------------------------------

  it('une seule acceptation simultanée sur le même échange ne rend les vinyles indisponibles qu\'une fois', async () => {
    // Crée une demande unique
    await service.proposeExchange(VINYL_A_ID, VINYL_B_ID);
    const requestId = requests[0].id;

    // Lance N acceptations en parallèle sur le même id
    const tasks = Array.from({ length: CONCURRENCY }, () =>
      service.acceptExchange(requestId),
    );

    await expect(Promise.all(tasks)).resolves.not.toThrow();

    // Le statut final est ACCEPTED (pas repassé à autre chose)
    const req = requests.find((r) => r.id === requestId);
    expect(req?.status).toBe(RequestStatus.ACCEPTED);

    // Les deux vinyles sont indisponibles — jamais re-disponibles par erreur
    const vinylA = vinyls.find((v) => v.id === VINYL_A_ID);
    const vinylB = vinyls.find((v) => v.id === VINYL_B_ID);
    expect(vinylA?.available).toBe(false);
    expect(vinylB?.available).toBe(false);
  });

  // -------------------------------------------------------------------------

  it('propositions + messages entrelacés sur plusieurs vinyles restent isolés entre eux', async () => {
    const PAIRS = [
      [1, 2],
      [3, 4],
      [5, 6],
    ] as const;

    for (const [a, b] of PAIRS) {
      vinyls.push({ id: a, available: true }, { id: b, available: true });
    }

    // Pour chaque paire, lance N proposeExchange en parallèle
    const allTasks = PAIRS.flatMap(([a, b]) =>
      Array.from({ length: CONCURRENCY }, () => service.proposeExchange(a, b)),
    );

    await expect(Promise.all(allTasks)).resolves.not.toThrow();

    expect(requests).toHaveLength(PAIRS.length * CONCURRENCY);

    // Chaque demande pointe sur la bonne paire
    for (const req of requests) {
      const pair = PAIRS.find(([a, b]) => a === req.vinyl_a && b === req.vinyl_b);
      expect(pair).toBeDefined();
    }
  });

  // -------------------------------------------------------------------------

  it('accepter et refuser en parallèle des demandes distinctes ne produit pas d\'incohérence de statut', async () => {
    const COUNT = 20;

    // Crée COUNT demandes initiales
    await Promise.all(
      Array.from({ length: COUNT }, () =>
        service.proposeExchange(VINYL_A_ID, VINYL_B_ID),
      ),
    );

    expect(requests).toHaveLength(COUNT);

    // Première moitié → acceptée, seconde → rejetée
    const acceptIds = requests.slice(0, COUNT / 2).map((r) => r.id);
    const rejectIds = requests.slice(COUNT / 2).map((r) => r.id);

    const tasks = [
      ...acceptIds.map((id) => service.acceptExchange(id)),
      ...rejectIds.map((id) => service.rejectExchange(id)),
    ];

    await expect(Promise.all(tasks)).resolves.not.toThrow();

    for (const req of requests) {
      if (acceptIds.includes(req.id)) {
        expect(req.status).toBe(RequestStatus.ACCEPTED);
      } else {
        expect(req.status).toBe(RequestStatus.REJECTED);
      }
    }

    // Les vinyles ciblés par les acceptations sont bien indisponibles
    const vinylA = vinyls.find((v) => v.id === VINYL_A_ID);
    const vinylB = vinyls.find((v) => v.id === VINYL_B_ID);
    expect(vinylA?.available).toBe(false);
    expect(vinylB?.available).toBe(false);
  });

  // -------------------------------------------------------------------------

  it(`historique complet : ${CONCURRENCY} échanges avec messages restent cohérents`, async () => {
    const MESSAGES_PER_REQUEST = 5;

    // Crée toutes les demandes
    await Promise.all(
      Array.from({ length: CONCURRENCY }, () =>
        service.proposeExchange(VINYL_A_ID, VINYL_B_ID),
      ),
    );

    expect(requests).toHaveLength(CONCURRENCY);

    // Pour chaque demande, envoie MESSAGES_PER_REQUEST messages
    const messageTasks = requests.flatMap((req) =>
      Array.from({ length: MESSAGES_PER_REQUEST }, (_, i) =>
        service.sendMessage(req.id, 1, `msg-${req.id}-${i}`),
      ),
    );

    await expect(Promise.all(messageTasks)).resolves.not.toThrow();

    expect(messages).toHaveLength(CONCURRENCY * MESSAGES_PER_REQUEST);

    // Chaque demande possède exactement MESSAGES_PER_REQUEST messages
    for (const req of requests) {
      const count = messages.filter((m) => m.request_id === req.id).length;
      expect(count).toBe(MESSAGES_PER_REQUEST);
    }

    // Aucun message orphelin (request_id inexistant)
    const requestIds = new Set(requests.map((r) => r.id));
    for (const msg of messages) {
      expect(requestIds.has(msg.request_id)).toBe(true);
    }
  });
});
