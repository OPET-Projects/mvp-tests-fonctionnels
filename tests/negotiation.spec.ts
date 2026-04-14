import { test, expect } from '@playwright/test';

const CURRENT_USER = { id: 1, name: 'Alice' };
const OTHER_USER = { id: 2, name: 'Bob' };

const VINYL_A = { id: 5, title: 'Abbey Road', artist: 'The Beatles', description: '', file_url: null, user_id: CURRENT_USER.id, available: true, genre: 'Rock' };
const VINYL_B = { id: 10, title: 'Kind of Blue', artist: 'Miles Davis', description: '', file_url: null, user_id: OTHER_USER.id, available: true, genre: 'Jazz' };

// Requête brute retournée par GET /api/requests/42
const RAW_REQUEST = { id: 42, status: 'PENDING', vinyl_a: VINYL_A.id, vinyl_b: VINYL_B.id };

const MOCK_MESSAGES = [
  { id: 1, content: 'Salut, intéressé par un échange ?', user_id: CURRENT_USER.id, request_id: 42, created_at: new Date().toISOString() },
  { id: 2, content: 'Oui, pourquoi pas !', user_id: OTHER_USER.id, request_id: 42, created_at: new Date().toISOString() },
];

/**
 * Mock tous les appels nécessaires à fetchEnrichedExchangeRequestById :
 * GET /api/requests/42 → /api/vinyls/5 → /api/vinyls/10 → /api/users/1 → /api/users/2
 */
async function mockExchangeDetail(page: import('@playwright/test').Page, status = 'PENDING') {
  await page.route('**/api/requests/42', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 200, json: { status: 200 } });
    } else {
      await route.fulfill({ json: [{ ...RAW_REQUEST, status }] });
    }
  });
  await page.route('**/api/vinyls/5', async (route) => {
    await route.fulfill({ json: [VINYL_A] });
  });
  await page.route('**/api/vinyls/10', async (route) => {
    await route.fulfill({ json: [VINYL_B] });
  });
  await page.route('**/api/users/1', async (route) => {
    await route.fulfill({ json: [CURRENT_USER] });
  });
  await page.route('**/api/users/2', async (route) => {
    await route.fulfill({ json: [OTHER_USER] });
  });
  await page.route('**/api/messages/42', async (route) => {
    await route.fulfill({ json: MOCK_MESSAGES });
  });
}

/** Mock la page /exchanges (liste) pour éviter de vrais appels DB après redirection */
async function mockExchangesList(page: import('@playwright/test').Page, userId: number) {
  await page.route(`**/api/requests/sender/${userId}`, async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route(`**/api/requests/receiver/${userId}`, async (route) => {
    await route.fulfill({ json: [] });
  });
}

// ---------------------------------------------------------------------------

test.describe('Proposition d\'échange (BarterForm)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((id) => localStorage.setItem('userId', String(id)), CURRENT_USER.id);

    await page.route('**/api/vinyls/10', async (route) => {
      await route.fulfill({ json: [VINYL_B] });
    });
    await page.route('**/api/vinyls/user/1', async (route) => {
      await route.fulfill({ json: [VINYL_A] });
    });
  });

  // --- Cas usuel ---

  test('affiche le vinyle convoité sur la page barter', async ({ page }) => {
    await page.goto('/barter/10');

    await expect(page.getByText('Kind of Blue')).toBeVisible();
    await expect(page.getByText('Miles Davis')).toBeVisible();
  });

  test('soumettre une proposition valide affiche un toast de succès', async ({ page }) => {
    await page.route('**/api/barter', async (route) => {
      await route.fulfill({ status: 200, json: { id: 42 } });
    });

    await page.goto('/barter/10');

    await page.locator('#items').selectOption(String(VINYL_A.id));
    await page.locator('#message').fill('Je propose mon Abbey Road contre ton Kind of Blue !');
    await page.getByRole('button', { name: 'Envoyer la demande' }).click();

    await expect(page.getByText(/Demande de troc envoyée/i)).toBeVisible();
  });

  // --- Cas extrême ---

  test('affiche une erreur de validation si aucun vinyle n\'est sélectionné', async ({ page }) => {
    await page.goto('/barter/10');

    await page.locator('#message').fill('Proposition sans vinyle sélectionné');
    await page.getByRole('button', { name: 'Envoyer la demande' }).click();

    await expect(page.getByText('Sélectionnez un vinyle.')).toBeVisible();
  });

  test('affiche une erreur de validation si le message est trop court (< 10 caractères)', async ({ page }) => {
    await page.goto('/barter/10');

    await page.locator('#items').selectOption(String(VINYL_A.id));
    await page.locator('#message').fill('Court');
    await page.getByRole('button', { name: 'Envoyer la demande' }).click();

    await expect(page.getByText(/10 caractères minimum/i)).toBeVisible();
  });

  // --- Cas erreur ---

  test('affiche un toast d\'erreur si l\'API barter répond 500', async ({ page }) => {
    await page.route('**/api/barter', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'Erreur serveur' } });
    });

    await page.goto('/barter/10');

    await page.locator('#items').selectOption(String(VINYL_A.id));
    await page.locator('#message').fill('Proposition longue et valide pour le test');
    await page.getByRole('button', { name: 'Envoyer la demande' }).click();

    await expect(page.getByText('Erreur serveur')).toBeVisible();
  });

});

// ---------------------------------------------------------------------------

test.describe('Détail d\'un échange — négociation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((id) => localStorage.setItem('userId', String(id)), CURRENT_USER.id);
  });

  // --- Cas usuel ---

  test('affiche le récapitulatif des deux vinyls', async ({ page }) => {
    await mockExchangeDetail(page);
    await page.goto('/exchanges/42');

    await expect(page.getByText('Abbey Road')).toBeVisible();
    await expect(page.getByText('Kind of Blue')).toBeVisible();
  });

  test('affiche l\'historique des messages', async ({ page }) => {
    await mockExchangeDetail(page);
    await page.goto('/exchanges/42');

    await expect(page.getByText('Salut, intéressé par un échange ?')).toBeVisible();
    await expect(page.getByText('Oui, pourquoi pas !')).toBeVisible();
  });

  test('l\'expéditeur peut envoyer un message', async ({ page }) => {
    const newMessage = { id: 3, content: 'Nouveau message de test', user_id: CURRENT_USER.id, request_id: 42, created_at: new Date().toISOString() };

    await mockExchangeDetail(page);

    await page.route('**/api/messages', async (route) => {
      await route.fulfill({ status: 200, json: newMessage });
    });

    let callCount = 0;
    await page.route('**/api/messages/42', async (route) => {
      callCount++;
      const messages = callCount === 1 ? MOCK_MESSAGES : [...MOCK_MESSAGES, newMessage];
      await route.fulfill({ json: messages });
    });

    await page.goto('/exchanges/42');

    const input = page.getByPlaceholder('Votre message…');
    await input.fill('Nouveau message de test');
    await page.getByRole('button', { name: 'Envoyer' }).click();

    await expect(page.getByText('Nouveau message de test')).toBeVisible();
  });

  test('l\'expéditeur ne voit pas les boutons Accepter/Refuser', async ({ page }) => {
    await mockExchangeDetail(page);
    await page.goto('/exchanges/42');

    await expect(page.getByRole('button', { name: /Accepter l'échange/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Refuser l'échange/i })).not.toBeVisible();
  });

  test('le destinataire voit les boutons Accepter et Refuser', async ({ page }) => {
    // Se connecter en tant que Bob (receiver = vinylB.user_id = 2)
    await page.evaluate((id) => localStorage.setItem('userId', String(id)), OTHER_USER.id);
    await mockExchangeDetail(page);
    await page.goto('/exchanges/42');

    await expect(page.getByRole('button', { name: /Accepter l'échange/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Refuser l'échange/i })).toBeVisible();
  });

  test('accepter l\'échange redirige vers /exchanges', async ({ page }) => {
    await page.evaluate((id) => localStorage.setItem('userId', String(id)), OTHER_USER.id);
    await mockExchangeDetail(page);
    await mockExchangesList(page, OTHER_USER.id);

    await page.goto('/exchanges/42');
    await page.getByRole('button', { name: /Accepter l'échange/i }).click();

    await expect(page).toHaveURL('/exchanges');
  });

  test('refuser l\'échange redirige vers /exchanges', async ({ page }) => {
    await page.evaluate((id) => localStorage.setItem('userId', String(id)), OTHER_USER.id);
    await mockExchangeDetail(page);
    await mockExchangesList(page, OTHER_USER.id);

    await page.goto('/exchanges/42');
    await page.getByRole('button', { name: /Refuser l'échange/i }).click();

    await expect(page).toHaveURL('/exchanges');
  });

  // --- Cas extrême ---

  test('le champ message est masqué quand l\'échange n\'est plus PENDING', async ({ page }) => {
    await mockExchangeDetail(page, 'ACCEPTED');
    await page.goto('/exchanges/42');

    await expect(page.getByPlaceholder('Votre message…')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Envoyer' })).not.toBeVisible();
  });

  test('affiche "Aucun message" quand la négociation est vide', async ({ page }) => {
    await mockExchangeDetail(page);
    // Override le mock messages avec une liste vide
    await page.route('**/api/messages/42', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/exchanges/42');

    await expect(page.getByText('Aucun message pour le moment.')).toBeVisible();
  });

  // --- Cas erreur ---

  test('affiche une erreur si l\'API exchange échoue', async ({ page }) => {
    // abort() lève une erreur réseau : le service n'a pas de garde sur response.ok,
    // donc on force une vraie exception pour que le catch de la page s'active
    await page.route('**/api/requests/42', async (route) => {
      await route.abort();
    });
    await page.route('**/api/messages/42', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/exchanges/42');

    await expect(page.getByText(/Impossible de charger l'échange/i)).toBeVisible();
  });

});
