import { test, expect } from '@playwright/test';
test.setTimeout(120000); // 2 minutes timeout for this test

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

test('Step 4: Login as Julia and create a document and add Ethan as a PreApprover', async ({ page }, testInfo) => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE || "", process.env.MS_PASSWORD || '');
  await page.waitForLoadState('networkidle', { timeout: 20_000 });
  await page.getByTestId('lsb.nav-main.documents-createDemoDoc').click();
  await page.waitForTimeout(500)
  await page.getByTestId('createDemoDocumentDialog.createButton').click()
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await page.getByTestId('docExecutionPage.rsb.fillout.preApprovalAddButton').click();
  // click on the search input
  await page.getByTestId('addUsersDialog.searchTriggerInput').click();
  // type in the search input
  await page.getByTestId('addUsersDialog.searchInput').fill('Diego Siciliani');
  //click on diego siciliani in the search results
  await page.getByTestId('userlist.selection.object.Diego Siciliani').click({timeout: 1000});
  await page.getByTestId('docExecutionPage.rsb.fillout.saveButton').click({ timeout: 5000 });
  // wait for the preapproval to be added
  await page.waitForLoadState('networkidle', { timeout: 10000 })
  // check that the preapproval is added
  const preApprovalList = page.getByTestId('docExecutionPage.rsb.fillout.preApprovalParticipantsList');
  const preApprovalItem = preApprovalList.getByText('Diego Siciliani');
  await expect(preApprovalItem).toBeVisible({ timeout: 5000 });
})