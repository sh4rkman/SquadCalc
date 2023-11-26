import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Go to the starting url before each test.
  await page.goto('http://localhost:8080/');
  await expect(page).toHaveTitle(/SquadCalc/);
});

test.afterAll(async ({ page }) => {
  await page.close();
});

test('Wrong calcs', async ({ page }) => {

  // Invalid weapon
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('0B234');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01245');
  await expect(page.locator('#errorMsg')).toContainText("Invalid mortar");

  // Invalid target
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').fill('');
  await page.locator('#mortar-location').pressSequentially('b0234');
  await page.locator('#target-location').click();
  await page.locator('#target-location').fill('');
  await page.locator('#target-location').pressSequentially('C0f1245');
  await expect(page.locator('#errorMsg')).toContainText("Invalid target");

  // too far !
  await page.locator('#target-location').click();
  await page.locator('#target-location').fill('');
  await page.locator('#target-location').pressSequentially('G01245');
  await expect(page.locator('#errorMsg')).toContainText("Target is out of range");

  // weapon out of map
  await page.getByRole('textbox', { name: 'Al basrah' }).click();
  await page.getByRole('option', { name: 'Yehorivka' }).click();
  await expect(page.locator('#errorMsg')).toContainText("Mortar is out of map");

});

test('Basic calcs', async ({ page }) => {

  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('B02-34');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01-2-45');

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("1449");
});


test('Basic calcs + map', async ({ page }) => {

  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('B0234');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01245');

  // Select a map
  await page.getByRole('textbox', { name: 'Al basrah' }).click();
  await page.getByRole('option', { name: 'Kohat' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("1442");
});

test('Advanced calc', async ({ page }) => {

  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('B0234');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01245');

  // Select a map
  await page.getByRole('textbox', { name: 'Al basrah' }).click();
  await page.getByRole('option', { name: 'Kohat' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("1442");

  // Select BM21 Grad
  await page.getByRole('textbox', { name: 'mortar' }).click();
  await page.getByRole('option', { name: 'BM-21 Grad' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("20.4");

  // Change high/low calc
  await page.locator('#highlow i').click();
  
  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("84.8");

});

test('Save calc', async ({ page }) => {

  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('B0234');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01245');

  // Select mortar
  await page.getByRole('textbox', { name: 'mortar' }).click();
  await page.getByRole('option', { name: 'mortar' }).click();

  // Select a map
  await page.getByRole('textbox', { name: 'Al basrah' }).click();
  await page.getByRole('option', { name: 'Kohat' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("1442");
  
  // Save
  await page.locator('#copy').click();
  await page.locator('#savebutton').click();
  await expect(page.locator(".savedrow .savespan").first()).toContainText("➜ 33.7 - 1442")

  
  await page.locator(".savedrow .friendlyname").first().click();
  await page.locator(".savedrow .friendlyname").first().pressSequentially('Test custom name');
  await page.keyboard.press("Control+V");

  // delete save
  await page.locator('#saved i').first().click();
  await expect(page.locator(".savedrow .savespan").first()).toHaveCount(0);
});

test('Change theme', async ({ page, isMobile }) => {
  if(!isMobile){
    
    // Open FAB wheel
    await page.locator('label').nth(1).click();
    await expect(page.getByRole('contentinfo').locator('i').nth(1)).toBeVisible()

    // Change theme to dark
    await page.locator('.fab-action-2').click();
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    // Close FAB wheel
    await page.locator('span').nth(2).click();
    await expect(page.getByRole('contentinfo').locator('i').nth(1)).toBeHidden()
  }
});



