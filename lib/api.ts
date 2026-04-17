/**
 * Wrapper centralisé pour les appels HTTP côté client.
 *
 * Objectifs :
 * - Ajouter `Content-Type: application/json` quand un body est fourni
 * - Parser la réponse JSON et la typer via génériques
 * - Lever une `ApiError` exploitable (status + body) en cas de !response.ok
 * - Gérer proprement les réponses sans contenu (204)
 */

export type ApiErrorBody = {
  error?: string;
  detail?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(
      body.error ??
        body.detail ??
        `Request failed with status ${status}`,
    );
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Effectue un appel HTTP et retourne le JSON parsé typé `T`.
 * Lève une `ApiError` si la réponse n'est pas OK.
 */
export async function apiCall<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Pas de body JSON : on conserve un objet vide.
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
