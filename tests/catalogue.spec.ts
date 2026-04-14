import { test, expect } from '@playwright/test';

const MOCK_USER = { id: 1, name: 'Alice', code: 'ABC123' };

const MOCK_VINYLS = [
  { id: 10, title: 'Kind of Blue', artist: 'Miles Davis', description: 'Jazz classique', file_url: null, user_id: 2, available: true },
  { id: 11, title: 'Nevermind', artist: 'Nirvana', description: 'Grunge américain', file_url: null, user_id: 3, available: true },
];

test.describe('Parcours catalogue', () => {

  test.beforeEach(async ({ page }) => {
    // Bypass login en positionnant directement le userId dans localStorage
    await page.goto('/');
    await page.evaluate((id) => localStorage.setItem('userId', String(id)), MOCK_USER.id);
  });

  // --- Cas usuel ---

  test('affiche la liste des vinyls disponibles', async ({ page }) => {
    // getAllVinyls() appelle POST /api/vinyls/ (avec slash final)
    await page.route('**/api/vinyls/', async (route) => {
      await route.fulfill({ json: MOCK_VINYLS });
    });

    await page.goto('/vinyls');

    await expect(page.getByText('Kind of Blue')).toBeVisible();
    await expect(page.getByText('Miles Davis')).toBeVisible();
    await expect(page.getByText('Nevermind')).toBeVisible();
    await expect(page.getByText('Nirvana')).toBeVisible();
  });

  test('chaque vinyle affiche un bouton Échanger pointant vers /barter/:id', async ({ page }) => {
    await page.route('**/api/vinyls/', async (route) => {
      await route.fulfill({ json: MOCK_VINYLS });
    });

    await page.goto('/vinyls');

    const links = page.getByRole('link', { name: /Échanger/i });
    await expect(links).toHaveCount(MOCK_VINYLS.length);

    const firstHref = await links.first().getAttribute('href');
    expect(firstHref).toBe(`/barter/${MOCK_VINYLS[0].id}`);
  });

  test('naviguer vers la page barter depuis un vinyle du catalogue', async ({ page }) => {
    await page.route('**/api/vinyls/', async (route) => {
      await route.fulfill({ json: MOCK_VINYLS });
    });
    await page.route('**/api/vinyls/10', async (route) => {
      await route.fulfill({ json: [MOCK_VINYLS[0]] });
    });
    await page.route('**/api/vinyls/user/1', async (route) => {
      await route.fulfill({ json: [{ id: 5, title: 'Abbey Road', artist: 'The Beatles', description: '', file_url: null, user_id: 1, available: true }] });
    });

    await page.goto('/vinyls');
    await page.getByRole('link', { name: /Échanger/i }).first().click();

    await expect(page).toHaveURL(/\/barter\/10/);
    await expect(page.getByText('Créer une demande')).toBeVisible();
  });

  // --- Cas extrême ---

  test('affiche un message quand aucun vinyle n\'est disponible', async ({ page }) => {
    await page.route('**/api/vinyls/', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/vinyls');

    await expect(page.getByText('Aucun vinyle disponible')).toBeVisible();
  });

  // --- Cas erreur ---

  test('affiche un message d\'erreur si l\'API vinyls échoue', async ({ page }) => {
    await page.route('**/api/vinyls/', async (route) => {
      await route.fulfill({ status: 500, json: { detail: 'request failed' } });
    });

    await page.goto('/vinyls');

    await expect(page.getByText('Impossible de charger les vinyls')).toBeVisible();
  });

});

test.describe('Login', () => {

  test('connexion réussie redirige vers /vinyls', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      await route.fulfill({ json: [MOCK_USER] });
    });
    await page.route('**/api/vinyls/', async (route) => {
      await route.fulfill({ json: MOCK_VINYLS });
    });

    await page.goto('/');
    await page.getByPlaceholder('Code').fill('ABC123');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL('/vinyls');
  });

  test('code invalide affiche un toast d\'erreur', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/');
    await page.getByPlaceholder('Code').fill('WRONG1');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText(/Erreur lors de la connexion/i)).toBeVisible();
  });

  test('champ vide affiche un toast d\'erreur', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText(/Veuillez entrer un code/i)).toBeVisible();
  });

});
