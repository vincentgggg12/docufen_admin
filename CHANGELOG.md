## [1.0.6] - 2025-12-08

### Added
* Asynchronous pdf creation for jobs that take more than 60 seconds
* Keep alive pdf server calls

### Fixed
* D2-693 Non admin users being able to access /connectors url 
* D2-704 Searching for received documents (with missing properties) causes crash

## [1.0.5] - 2025-11-19

### Updated
* Version bump to keep insync with client

### Fixed
* D2-691 - fix of large document bug

## [1.0.4]  - 2025-10-09

## Fixed
* Vulnerability in vite development libraries

## [1.0.3]  - 2025-08-18

## Added
* Adds maintenance mode state management to track when the system is under maintenance
* Implements a maintenance bypass mechanism using session storage for testing purposes
* Creates a maintenance window page with localized content to inform users about scheduled maintenance

## Fixed 
* Controlled copies causing stale document
* Expired user not being able to login to valid other tenant

## [1.0.2] - 2025-08-11

### Version bumped to keep in sync with server 

## [1.0.1] - 2025-08-05

### Added
* Aptos font support D2-582

### Fixed
* Flickering popups on document update D2-579
* Failed to load alert on doccument loading and switching D2-578

### Removed
* Excessing logging

## [1.0.0] - 2025-07-25

### Initial release