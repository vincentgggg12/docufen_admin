import { test, expect } from '@playwright/test';
test.setTimeout(300000); // 5 minutes timeout for this test

import { microsoftLogin } from './utils/msLogin.ts';
import { runSetupTest, TenantConfig } from './utils/setup-helpers.ts';
import { logout as uiLogout } from './utils/logout.ts';
import dotenv from 'dotenv';
import { getScreenshotPath } from './utils/paths.ts';
import { time } from 'console';

// Load environment variables from .playwright.env
dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || 'https://beta.docufen.com';
// Define a simple recordTestStep function here to avoid having to create a new file
function recordTestStep(
  testId: string,
  description: string,
  status: 'passed' | 'failed',
  code?: string,
  details?: string[]
) {
  // Just log to console since we're not implementing the actual reporter
  console.log(`TEST STEP [${status}]: ${description}`);
}

// Configuration for 17NJ5D tenant
const config17NJ5D: TenantConfig = {
  name: '17NJ5D',
  userEmail: process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN || '',
  userManagerEmail: process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE || '',
  companyName: 'Pharma 17NJ5D',
  companyAddress: '1 Bourke St',
  companyCity: 'Melbourne',
  companyState: 'VIC',
  companyPostCode: '3000',
  companyCountry: 'Australia',
  businessRegistrationNumber: 'ABN5675',
  // Tenant Administrator details (Megan Bowen)
  tenantAdminName: 'Megan Bowen',
  tenantAdminInitials: 'MB',
  // User Manager details (Grady Archie)
  userManagerName: 'Grady Archie',
  userManagerInitials: 'GA',
  password: process.env.MS_PASSWORD || '',
};

// Configuration for XMWKB tenant
const configXMWKB: TenantConfig = {
  name: 'XMWKB',
  userEmail: process.env.MS_EMAIL_XMWKB_JULIA_SMITH || '',
  userManagerEmail: process.env.MS_EMAIL_XMWKB_AMELIA_CHEN || '',
  companyName: 'Biotech XMWKB',
  companyAddress: '1 George St',
  companyCity: 'Sydney',
  companyState: 'NSW',
  companyPostCode: '2000',
  companyCountry: 'Australia',
  businessRegistrationNumber: 'ABN3453',
  // Tenant Administrator details (Julia Smith)
  tenantAdminName: 'Julia Smith',
  tenantAdminInitials: 'JS',
  // User Manager details (Amelia Chen)
  userManagerName: 'Amelia Chen',
  userManagerInitials: 'AC',
  password: process.env.MS_PASSWORD || ''
};
const nj5dUserList = [
  ["Patti Fernandez", "pattiF@17nj5d.onmicrosoft.com", "Trial Admin"], 
  ["Joni Sherman", "joniS@17nj5d.onmicrosoft.com", "Creator"],
  ["Diego Siciliani", "diegoS@17nj5d.onmicrosoft.com", "Creator"], 
  ["Henrietta Mueller", "henriettaM@17nj5d.onmicrosoft.com", "Creator"],
  ["Johanna Lorenz", "johannaL@17nj5d.onmicrosoft.com", "Collaborator"], 
  ["Lee Gu", "leeG@17nj5d.onmicrosoft.com", "Collaborator"],
  ["Julia Smith", "julia@17nj5d.onmicrosoft.com", "Collaborator"]];
const xmwkbUserList = [
  ["Charlotte Smith", "charlotte@xmwkb.onmicrosoft.com", "Creator"], 
  ["Ethan Brown", "ethan@xmwkb.onmicrosoft.com", "Collaborator"]]

const inviteUser = async (page, userObj) => {
  let name: string, email: string, role: string;
  try {
    ([name, email, role] = userObj);
    console.log(`Inviting user: ${name}, Email: ${email}, Role: ${role}`);
    console.log('Clicking New User button...');
    const newUserButton = page.getByTestId('usersPage.addNewUserButton');
    await expect(newUserButton).toBeVisible({ timeout: 10000 });
    await newUserButton.click();
  } catch (err) {
    console.error('Error clicking New User button:', err.message);
    return;
  }
  await page.getByTestId('usersPage.addUserLegalNameInput').fill(name);

  // Fill in the Initials field using data-testid
  await page.getByTestId('usersPage.addUserInitialsInput').fill(name.split(' ').map(n => n[0].toUpperCase()).join(''));

  // Fill in the Email field using data-testid
  await page.getByTestId('usersPage.addUserEmailInput').fill(email);

  // Approach 2: Try finding Creator in list items
  try {
    await page.getByTestId('usersPage.addUserRoleSelectTrigger').click();
    const roleOption = page.getByRole('option', { name: role }).first();
    if (await roleOption.isVisible({ timeout: 3000 })) {
      console.log(`Found ${role} option directly, clicking it`);
      await roleOption.click({ force: true });
    }
  } catch (err) {
    console.log('List item approach failed:', err.message);
    return null
  }

  // Wait for dropdown to close
  await page.waitForTimeout(1000);
  await page.getByTestId("usersPage.addUserInviteButton").click({ timeout: 10000 });
  console.log(`User ${name} invited successfully`);
  await page.waitForTimeout(1000);

}

test.describe.serial('Test 01a: Setup 17NJ5D tenant', () => {
  test('Step 3: Accept all invites', async ({ page }, testInfo) => {
    // Set a higher resolution viewport for better visibility
    await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_MEGAN_BOWEN || '', process.env.MS_PASSWORD || '');
    await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 1920, height: 1080 });
    for (const userObj of nj5dUserList) {
      await inviteUser(page, userObj);
    }

    // Record Microsoft login step
    recordTestStep(
      testInfo.testId,
      'Log in as Megan and invite all the users',
      'passed',
      'await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE, process.env.MS_PASSWORD)',
      ['Uses Microsoft SSO login', 'Handles login redirects and permissions']
    );
  });
  test('step 2: Add all users to xmwkb', async({ page }, testInfo) => {
    await microsoftLogin(page, process.env.MS_EMAIL_XMWKB_AMELIA_CHEN || '', process.env.MS_PASSWORD || '');

    for (const userObj of xmwkbUserList) {
      await inviteUser(page, userObj);
    }
    recordTestStep(
      testInfo.testId,
      'Log in as Julia and invite all the users',
      'passed',
      'run inviteUser(page, userObj)',
      ['Users user details to invite', 'Handles login redirects and permissions']
    )
  })
    // Log in as Grady Archie
})

test.describe.serial('Test 01: Setup 17NJ5D users', () => {
  test('Step 3: Accept all invites', async ({ page }, testInfo) => {
    const testId = testInfo.testId;

    // Click "New User" button to create a new user
    for (const userObj of nj5dUserList) {
      if (userObj[0] === 'Patti Fernandez') continue
      console.log("Accepting invite:", userObj.join(', '));
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await microsoftLogin(page, userObj[1] || "", process.env.MS_PASSWORD || '');
      await page.waitForLoadState('domcontentloaded', { timeout: 50_000 });
    }
    for (const userObj of xmwkbUserList) {
      if (userObj[0] === 'Charlotte Smith') continue
      console.log("Accepting invite:", userObj.join(', '));
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await microsoftLogin(page, userObj[1] || "", process.env.MS_PASSWORD || '');
      console.log("User logged in:", userObj[1]);
      await page.waitForLoadState('domcontentloaded', { timeout: 50_000 });
    }
  })
})
