#!/bin/bash

# Script to find CRITICAL interactive elements missing data-testid
# Focuses on form submissions, auth flows, and key user actions
# Usage: ./find-critical-missing-testids.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Output file
OUTPUT_FILE="critical-missing-testids.txt"

# Critical patterns to find
declare -a CRITICAL_PATTERNS=(
    # Form submissions
    "type=[\"']submit[\"']"
    "type=[\"']button[\"'].*onSubmit"
    "onSubmit="
    "<form\b"
    
    # Authentication
    "login"
    "Login"
    "logout"
    "Logout"
    "signin"
    "SignIn"
    "signout"
    "SignOut"
    "password"
    "Password"
    
    # Save/Delete/Cancel actions
    "save"
    "Save"
    "delete"
    "Delete"
    "cancel"
    "Cancel"
    "confirm"
    "Confirm"
    "submit"
    "Submit"
    
    # Navigation
    "navigate"
    "Navigate"
    "router.push"
    "href="
    
    # Modal/Dialog triggers
    "open.*[Mm]odal"
    "close.*[Mm]odal"
    "show.*[Dd]ialog"
    "hide.*[Dd]ialog"
)

# Function to check context for data-testid
check_context_for_testid() {
    local file="$1"
    local line_num="$2"
    local pattern="$3"
    
    # Get 10 lines of context
    local start=$((line_num - 5))
    local end=$((line_num + 5))
    
    # Extract context
    local context=$(sed -n "${start},${end}p" "$file" 2>/dev/null)
    
    # Check for data-testid or testId
    if echo "$context" | grep -qE 'data-testid|testId'; then
        return 0
    fi
    
    return 1
}

# Function to identify component type
identify_component() {
    local line="$1"
    local file="$2"
    local line_num="$3"
    
    # Try to extract component name
    if echo "$line" | grep -qE '<[A-Z][a-zA-Z]*'; then
        echo "$line" | grep -oE '<[A-Z][a-zA-Z]*' | head -1 | tr -d '<'
    elif echo "$line" | grep -qE '<(button|input|select|form|a)\b'; then
        echo "$line" | grep -oE '<(button|input|select|form|a)\b' | head -1 | tr -d '<'
    else
        echo "element"
    fi
}

# Main execution
echo -e "${RED}=== CRITICAL Elements Missing data-testid ===${NC}"
echo "Searching for high-priority interactive elements without test IDs..."
echo ""

# Initialize report
> "$OUTPUT_FILE"
echo "=== Critical Interactive Elements Missing data-testid ===" >> "$OUTPUT_FILE"
echo "These elements are critical for E2E testing and should be fixed immediately" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Counter
total_critical=0

# Search in key directories
for dir in src/pages src/components; do
    [ -d "$dir" ] || continue
    
    echo -e "${BLUE}Scanning $dir for critical patterns...${NC}"
    
    # Find all React files
    find "$dir" -type f \( -name "*.tsx" -o -name "*.jsx" \) | while read -r file; do
        # Skip test files
        [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]] && continue
        
        # Check each critical pattern
        for pattern in "${CRITICAL_PATTERNS[@]}"; do
            grep -n -i "$pattern" "$file" 2>/dev/null | while IFS=: read -r line_num line_content; do
                # Skip comments
                echo "$line_content" | grep -qE '^\s*//|^\s*/\*' && continue
                
                # Check if it has data-testid nearby
                if ! check_context_for_testid "$file" "$line_num" "$pattern"; then
                    local component=$(identify_component "$line_content" "$file" "$line_num")
                    local context=$(echo "$line_content" | sed 's/^[[:space:]]*//' | cut -c1-100)
                    
                    echo "CRITICAL: $file:$line_num" >> "$OUTPUT_FILE"
                    echo "  Component: <$component>" >> "$OUTPUT_FILE"
                    echo "  Pattern: $pattern" >> "$OUTPUT_FILE"
                    echo "  Context: $context" >> "$OUTPUT_FILE"
                    echo "" >> "$OUTPUT_FILE"
                    
                    total_critical=$((total_critical + 1))
                fi
            done
        done
    done
done

# Special check for specific files
echo "" >> "$OUTPUT_FILE"
echo "=== Special Checks ===" >> "$OUTPUT_FILE"

# Check login/auth related files
echo "" >> "$OUTPUT_FILE"
echo "--- Authentication Flow ---" >> "$OUTPUT_FILE"
find src -name "*[Ll]ogin*" -o -name "*[Aa]uth*" | grep -E '\.(tsx|jsx)$' | while read -r file; do
    if [ -f "$file" ]; then
        # Count interactive elements without testid
        local missing=$(grep -E '<(Button|Input|Link|form)\b' "$file" | grep -v 'data-testid' | wc -l)
        if [ $missing -gt 0 ]; then
            echo "$file: $missing interactive elements without data-testid" >> "$OUTPUT_FILE"
        fi
    fi
done

# Check form-related files
echo "" >> "$OUTPUT_FILE"
echo "--- Form Components ---" >> "$OUTPUT_FILE"
find src -name "*[Ff]orm*" -o -name "*[Mm]odal*" | grep -E '\.(tsx|jsx)$' | while read -r file; do
    if [ -f "$file" ]; then
        local missing=$(grep -E '<(Button|Input|Select|Textarea)\b|type="submit"' "$file" | grep -v 'data-testid' | wc -l)
        if [ $missing -gt 0 ]; then
            echo "$file: $missing form elements without data-testid" >> "$OUTPUT_FILE"
        fi
    fi
done

# Summary
echo "" >> "$OUTPUT_FILE"
echo "=== SUMMARY ===" >> "$OUTPUT_FILE"
echo "Total critical elements missing data-testid: $total_critical" >> "$OUTPUT_FILE"

# Terminal output
echo ""
echo -e "${RED}Found $total_critical critical elements without data-testid${NC}"
echo ""
echo -e "${YELLOW}Key areas to focus on:${NC}"
echo "1. Authentication flows (login/logout)"
echo "2. Form submissions"
echo "3. Data mutation actions (save/delete)"
echo "4. Modal/Dialog triggers"
echo "5. Primary navigation elements"
echo ""
echo -e "${GREEN}Report saved to:${NC} $OUTPUT_FILE"

# Generate fix suggestions
FIX_FILE="critical-testid-fixes.md"
> "$FIX_FILE"

cat << 'EOF' >> "$FIX_FILE"
# Critical data-testid Fix Guide

## Naming Convention

Use descriptive, action-oriented names:

### Authentication
```tsx
data-testid="login-email-input"
data-testid="login-password-input"
data-testid="login-submit-button"
data-testid="logout-button"
```

### Forms
```tsx
data-testid="form-[formname]-submit"
data-testid="form-[formname]-cancel"
data-testid="input-[fieldname]"
data-testid="select-[fieldname]"
```

### Modals/Dialogs
```tsx
data-testid="modal-[name]-trigger"
data-testid="modal-[name]-confirm"
data-testid="modal-[name]-cancel"
data-testid="modal-[name]-close"
```

### Navigation
```tsx
data-testid="nav-[destination]"
data-testid="link-[destination]"
data-testid="menu-[item]"
```

### Actions
```tsx
data-testid="button-save-[entity]"
data-testid="button-delete-[entity]"
data-testid="button-edit-[entity]"
data-testid="button-create-[entity]"
```

## Example Fixes

### Before:
```tsx
<Button onClick={handleSubmit}>Save Document</Button>
```

### After:
```tsx
<Button onClick={handleSubmit} data-testid="button-save-document">
  Save Document
</Button>
```

### Before:
```tsx
<Input type="email" value={email} onChange={setEmail} />
```

### After:
```tsx
<Input 
  type="email" 
  value={email} 
  onChange={setEmail}
  data-testid="input-email"
/>
```
EOF

echo -e "${GREEN}Fix guide saved to:${NC} $FIX_FILE"