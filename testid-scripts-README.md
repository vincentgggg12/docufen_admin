# data-testid Finder Scripts

This directory contains three bash scripts to help identify interactive UI elements that are missing `data-testid` attributes, which are essential for E2E testing.

## Scripts Overview

### 1. `find-missing-testids.sh` - Basic Scanner
The foundational script that searches for common interactive elements missing data-testid attributes.

**Usage:**
```bash
./find-missing-testids.sh
```

**Features:**
- Searches for basic interactive components (Button, Input, Select, etc.)
- Detects onClick handlers without data-testid
- Generates summary reports
- Creates CSV export for easy analysis
- Highlights recently modified files (if git is available)

**Output Files:**
- `missing-testids-report.txt` - Full report
- `missing-testids.csv` - CSV format for spreadsheet analysis
- `missing-testids-recent.txt` - Report for recently modified files

### 2. `find-missing-testids-advanced.sh` - Advanced Scanner
An enhanced version with better pattern matching and priority classification.

**Usage:**
```bash
# Scan all files
./find-missing-testids-advanced.sh

# Scan only recently modified files (last 30 days)
./find-missing-testids-advanced.sh --recent-only
```

**Features:**
- Expanded component list (30+ component types)
- Priority classification (HIGH/MEDIUM/LOW)
- Better multi-line component detection
- Context-aware analysis
- Component frequency analysis
- Optional quick-fix snippet generator

**Output Files:**
- `missing-testids-detailed.txt` - Detailed report with context
- `missing-testids-detailed.csv` - CSV with priority levels
- `missing-testids-priority.txt` - High priority items only
- `testid-fixes.txt` - Common fix patterns (if requested)

### 3. `find-critical-missing-testids.sh` - Critical Elements Scanner
Focuses specifically on critical user interactions that must have test IDs.

**Usage:**
```bash
./find-critical-missing-testids.sh
```

**Features:**
- Searches for authentication flows
- Identifies form submissions
- Finds save/delete/cancel actions
- Detects modal/dialog triggers
- Special checks for auth and form files
- Generates fixing guide with examples

**Output Files:**
- `critical-missing-testids.txt` - Critical elements report
- `critical-testid-fixes.md` - Comprehensive fixing guide

## What Gets Checked

### Interactive Components
- Form elements: Button, Input, Select, Textarea, Checkbox, Switch, Toggle
- Navigation: Link, TabsTrigger, NavigationMenuItem, BreadcrumbItem
- Dropdowns: DropdownMenuItem, DropdownMenuTrigger, SelectTrigger
- Dialogs: DialogTrigger, AlertDialogTrigger, SheetTrigger
- Other: DatePicker, Calendar, Accordion, Carousel controls

### Event Handlers
- onClick events
- onSubmit handlers
- onChange callbacks
- Form submissions

### Critical Patterns
- Login/logout flows
- Password fields
- Submit buttons
- Delete confirmations
- Navigation actions

## Interpreting Results

### Priority Levels (Advanced Scanner)
- **HIGH**: Critical interactive elements (buttons, form submits, auth flows)
- **MEDIUM**: Important but non-critical elements (form fields, navigation)
- **LOW**: Nice-to-have elements (display components with interactions)

### File Paths
All reports show absolute file paths with line numbers for easy navigation:
```
/path/to/file.tsx:123 - <Button>
```

### CSV Format
The CSV files can be imported into spreadsheets for:
- Sorting by priority
- Filtering by component type
- Tracking fix progress
- Generating reports

## Best Practices for Fixing

### Naming Convention
```tsx
// Buttons
data-testid="button-[action]-[entity]"
data-testid="button-save-document"

// Inputs
data-testid="input-[fieldname]"
data-testid="input-email"

// Navigation
data-testid="nav-[destination]"
data-testid="link-home"

// Modals
data-testid="modal-[name]-trigger"
data-testid="modal-confirm-delete-trigger"
```

### Example Fix
```tsx
// Before
<Button onClick={handleSave}>Save</Button>

// After
<Button onClick={handleSave} data-testid="button-save">
  Save
</Button>
```

## Workflow Recommendation

1. **Start with Critical Scanner**
   ```bash
   ./find-critical-missing-testids.sh
   ```
   Fix all critical elements first.

2. **Run Advanced Scanner on Recent Files**
   ```bash
   ./find-missing-testids-advanced.sh --recent-only
   ```
   Focus on recently modified files.

3. **Full Scan for Comprehensive Coverage**
   ```bash
   ./find-missing-testids-advanced.sh
   ```
   Address remaining elements by priority.

4. **Regular Checks**
   Run the scanners as part of your CI/CD pipeline or before releases.

## Limitations

- Scripts focus on React/TypeScript patterns
- May have false positives for dynamically generated elements
- Comments are excluded but string literals might be included
- Multi-line component detection has a 50-line limit

## Tips

- Use the CSV exports to track progress in a spreadsheet
- Focus on HIGH priority items first
- Run `--recent-only` flag during active development
- Check the generated fix guides for consistent naming
- Consider adding these checks to your pre-commit hooks