import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { microsoftLogin } from './utils/msLogin';
import * as fs from 'fs';
import * as path from 'path';
import { create } from 'domain';
import { env } from 'process';
test.setTimeout(12000000); // 2 minutes timeout for this test


test.use({
  viewport: {
    height: 1080,
    width: 1920
  }
});

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

const createDocument = async (page, name: string, referenceId: string, testId: string) => {
  // Navigate to the documents page
  const newDocButton = page.getByTestId('lsb.nav-main.documents-newDocument');
  await expect(newDocButton).toBeVisible({ timeout: 10000 });
  await newDocButton.click();
  console.log("Clicked 'New Document' button");
  const inputName = page.getByTestId('createDocumentDialog.documentNameInput');
  await expect(inputName).toBeVisible({ timeout: 10000 });
  await inputName.click();
  console.log(`Filling document name: ${name}`);
  await inputName.fill(name);
  const inputReference = page.getByTestId('createDocumentDialog.externalReferenceInput');
  await expect(inputReference).toBeVisible({ timeout: 10000 });
  await inputReference.click();
  console.log(`Filling document reference: ${referenceId}`);
  await inputReference.fill(referenceId);
  const categorySelect = page.getByTestId('createDocumentDialog.documentCategorySelectTrigger');
  await expect(categorySelect).toBeVisible({ timeout: 10000 });
  await categorySelect.click();
  await page.getByRole('option', { name: 'Test Method' }).click();

  const uploadButton = page.getByTestId('createDocumentDialog.uploadDocumentButton');
  await expect(uploadButton).toBeVisible({ timeout: 10000 });
  await uploadButton.click();
  console.log("Clicked 'Upload Document' button");

  const fileInputElement = page.getByTestId('createDocumentDialog.fileUploadInput')
  page.waitForTimeout(500); // Wait for the file input to be available
  const filePath = 'playwright/tests/WordDocuments/Docufen Testing Document v0._EN.docx';
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${path.resolve(filePath)}`);
  }
  await fileInputElement.setInputFiles(filePath);
  console.log(`Uploading document: Docufen Testing Document v0._EN.docx`);

  await page.waitForTimeout(500); // Wait for the upload dialog to open
  console.log(`Uploading document: Docufen Testing Document v0._EN.docx`);
  const createButton = page.getByTestId('createDocumentDialog.createDocumentButton');
  await expect(createButton).toBeEnabled({ timeout: 30000 });
  await createButton.click();
  console.log(`Creating document with name: ${name} and reference: ${referenceId}`);
  await page.waitForTimeout(5000); // Wait for the upload dialog to open
  await page.waitForLoadState('networkidle');
  const escapedBaseUrl = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regExp = new RegExp(`${escapedBaseUrl}/document/[a-f0-9\\-]{8}-[a-f0-9\\-]{4}-[a-f0-9\\-]{4}-[a-f0-9\\-]{4}-[a-f0-9\\-]{12}`);
  const currentUrl = page.url();
  console.log(`Current URL before wait: ${currentUrl}`);
  await page.waitForURL(regExp);
  await page.waitForLoadState('domcontentloaded');
  await page.goto(`${baseUrl}/documents`);
  await page.waitForURL(`${baseUrl}/documents`);
  recordTestStep(testId, `Created document ${name} with reference ${referenceId}`, 'passed');
}
dotenv.config({ path: '.playwright.env' });
const baseUrl = process.env.BASE_URL || 'https://beta.docufen.com';
// Shared credentials & config for 17NJ5D tenant – values are pulled from the .playwright.env file
const email = process.env.MS_EMAIL_17NJ5D_GRADY_ARCHIE || ''
const password = process.env.MS_PASSWORD || '';
test.describe.serial('Test 001: Setup – Create Organisation 17NJ5D', () => {
  test('Step 1: Create Grady Documents', async ({ page }, testInfo) => {
    // Store testId for test results collection
    const testId = testInfo.testId;

    // Allow this step up to 20 minutes because of Microsoft login
    testInfo.setTimeout(1200000);
    await page.goto(`${baseUrl}/login`);
    // Login as Megan Bowen
    await microsoftLogin(page, email, password);
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    await page.goto(`${baseUrl}/documents`);
    await page.waitForURL(`${baseUrl}/documents`);
    for (let i = 1; i < 11; i++) {
      const name = `GRADY_DOC${i}`;
      const referenceId = `GD-${i.toString().padStart(3, '0')}`;
      await createDocument(page, name, referenceId, testId)
    }
  });
  test('Step 2: Create Diego Documents', async ({ page }, testInfo) => {
    // Store testId for test results collection
    const testId = testInfo.testId;

    // Allow this step up to 20 minutes because of Microsoft login
    testInfo.setTimeout(1200000);
    await page.goto(`${baseUrl}/login`);
    // Login as Megan Bowen
    await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_DIEGO_SICILIANI || '', password);
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    await page.goto(`${baseUrl}/documents`);
    await page.waitForURL(`${baseUrl}/documents`);
    console.log(`Creating Diego documents for testId: ${testId}`);
    for (let i = 1; i < 11; i++) {
      const name = `DIEGO_DOC${i}`;
      const referenceId = `DD-${i.toString().padStart(3, '0')}`;
      await createDocument(page, name, referenceId, testId)
    }
  });
  test('Step 3: Create Amelia Documents', async ({ page }, testInfo) => {
    // Store testId for test results collection
    const testId = testInfo.testId;

    // Allow this step up to 20 minutes because of Microsoft login
    testInfo.setTimeout(1200000);
    await page.goto(`${baseUrl}/login`);
    // Login as Megan Bowen
    await microsoftLogin(page, process.env.MS_EMAIL_XMWKB_AMELIA_CHEN || '', password);
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    await page.goto(`${baseUrl}/documents`);
    await page.waitForURL(`${baseUrl}/documents`);
    console.log(`Creating Amelia's documents for testId: ${testId}`);
    for (let i = 1; i < 11; i++) {
      const name = `AMELIA_DOC${i}`;
      const referenceId = `AD-${i.toString().padStart(3, '0')}`;
      await createDocument(page, name, referenceId, testId)
    }
  });
  test('Step 3: Create Julia Documents', async ({ page }, testInfo) => {
    // Store testId for test results collection
    const testId = testInfo.testId;

    // Allow this step up to 20 minutes because of Microsoft login
    testInfo.setTimeout(1200000);
    await page.goto(`${baseUrl}/login`);
    await microsoftLogin(page, process.env.MS_EMAIL_17NJ5D_JULIA_SMITH || '', password);
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    await page.goto(`${baseUrl}/documents`);
    await page.waitForURL(`${baseUrl}/documents`);
    for (let i = 1; i < 11; i++) {
      const name = `Julia_DOC${i}`;
      const referenceId = `JD-${i.toString().padStart(3, '0')}`;
      await createDocument(page, name, referenceId, testId)
    }
  });
})
