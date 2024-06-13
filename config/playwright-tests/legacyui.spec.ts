import { test, expect, Page } from '@playwright/test';


let page: Page;


test.afterEach(async ({  }) => {
  await page.close();
});

test.beforeEach(async ({browser }) => {
  // Go to the starting url before each test.
  page = await browser.newPage();
  await page.goto('https://dev.squadcalc.app/');
  await expect(page).toHaveTitle(/SquadCalc/);
  await page.getByRole('contentinfo').locator('label').first().click();
});


test('Wrong calcs', async ({  }) => {

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

  // weapon out of map
  await page.getByRole('textbox', { name: 'kohat' }).click();
  await page.getByRole('option', { name: 'Al basrah' }).click();
  await page.locator('#target-location').click();
  await page.locator('#target-location').fill('');
  await page.locator('#target-location').pressSequentially('G02-3-4');
  await expect(page.locator('#errorMsg')).toContainText("Target is out of range");

});

test('Basic calcs', async ({  }) => {
  await page.getByRole('textbox', { name: 'kohat' }).click();
  await page.getByRole('option', { name: 'Al basrah' }).click();
  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('B02-34');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01-2-45');

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("1449");
});


test('Basic calcs + map', async ({  }) => {
  await page.getByRole('textbox', { name: 'kohat' }).click();
  await page.getByRole('option', { name: 'Al basrah' }).click();
  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('B0234');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01245');

  // Select a map
  await page.getByRole('textbox', { name: 'Al basrah' }).click();
  await page.getByRole('option', { name: 'MANICOUAGAN' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("1444");
});

test('Advanced calc', async ({  }) => {
  await page.getByRole('textbox', { name: 'kohat' }).click();
  await page.getByRole('option', { name: 'Al basrah' }).click();
  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('C05855');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('F0675');

  // Select a map
  await page.getByRole('textbox', { name: 'Al basrah' }).click();
  await page.getByRole('option', { name: 'BLACK COAST' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("110.6");
  await expect(page.locator('#elevationNum')).toContainText("1214");

  // Select BM21 Grad
  await page.getByRole('textbox', { name: 'Mortar', exact: true }).click();
  await page.getByRole('option', { name: 'BM-21 Grad' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("110.6");
  await expect(page.locator('#elevationNum')).toContainText("11.1");

  // Change high/low calc
  await page.locator('#highlow i').click();
  
  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("110.6");
  await expect(page.locator('#elevationNum')).toContainText("77.7");

});

test('Save calc', async ({  }) => {
  await page.getByRole('textbox', { name: 'kohat' }).click();
  await page.getByRole('option', { name: 'Al basrah' }).click();
  // pressSequentially coordonates
  await page.locator('#mortar-location').click();
  await page.locator('#mortar-location').pressSequentially('B0234');
  await page.locator('#target-location').click();
  await page.locator('#target-location').pressSequentially('C01245');

  // Select mortar
  await page.getByRole('textbox', { name: 'Mortar', exact: true }).click();
  await page.getByRole('option', { name: 'Mortar', exact: true }).click();

  // Select a map
  await page.getByRole('textbox', { name: 'Al basrah' }).click();
  await page.getByRole('option', { name: 'BLACK COAST' }).click();

  // Check calcs
  await expect(page.locator('#bearingNum')).toContainText("33.7");
  await expect(page.locator('#elevationNum')).toContainText("1450");
  
  // Save
  await page.locator('#copy').click();
  await page.locator('#savebutton').click();
  await expect(page.locator(".savedrow .savespan").first()).toContainText("➜ 33.7 - 1450")

  
  await page.locator(".savedrow .friendlyname").first().click();
  await page.locator(".savedrow .friendlyname").first().pressSequentially('Test custom name');
  await page.keyboard.press("Control+V");

  // delete save
  await page.locator('#saved i').first().click();
  await expect(page.locator(".savedrow .savespan").first()).toHaveCount(0);
});



