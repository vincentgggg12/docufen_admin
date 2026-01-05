Instructions
Read docufen_client/PLAYWRIGHT_TEST_GUIDELINES.md and learn how we develop the playwright scripts.

Then read docufen_client/Documentation/Validation/08_OQ_OperationalQualification.md and develop the playwright test script for tests:
Consider Section: 1. Login & Authentication 
 
Use playwright MCP server and run the OQ test first, learn if there are any points that playwright script should be coded with. Note that the OQ has sections for themes/epics and the playwright test scripts should be saved accordingly in the /docufen_client/playwright/tests/ theme etc.
 
Remember to use assertions if the test case in OQ requests it, and remember the (SC) means that a screenshot in that step is needed as it will be the test evidence. Remember that for example a screenshot for a dialog, may need 0.5 wait otherwise it captures the screenshot as the dialog is opening and looks faded.
 
TEST SCRIPTS DEVELOPMENT
 
  1. Study docufen_client/PLAYWRIGHT_TEST_GUIDELINES.md - focus on:
     - data-testid selectors, Page Object Model, fixtures
 
  2. For each test case (TS.X.X-XX) in the current Section of 
  docufen_client/Documentation/Validation/08_OQ_OperationalQualification.md sporn a new sub task to create the script
 
  4. Develop the script:
     - For each test case
     - Location: /docufen_client/playwright/tests/[section#].[SectionName]/
     - Filename: TS-X-X-XX-[test-name].spec.ts
     - If there is already a TS-X-X-XX-[test-name].spec.ts file read it and assess if it covers the written description in docufen_client/Documentation/Validation/08_OQ_OperationalQualification.md
     - Use OQ preliminary setup users (Megan, Diego, etc.)
     - Include all Expected Result assertions
     - Screenshots: Consider when a few ms wait at (SC) markers for dialogs, uploads etc to capture the screenshot at the right time.
     - Follow test.describe structure from guidelines
 
  5. Remember:
     - Link to FS IDs in comments
     - Handle dynamic content with proper waits
     - Use existing page objects where available
     - Use the url host: from the BASE_URL environment variable
     - Check that the tests run successfully and if they dont run successfully try to fix  the spec.ts file or report that there is a bug in the application.
 