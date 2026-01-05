#!/bin/bash

# Script to find interactive elements missing data-testid attributes
# Focuses on recently modified files

echo "=== Checking for Missing data-testid Attributes ==="
echo "Focus: Recently modified files from the last 7 days"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get list of recently modified files (last 7 days)
RECENT_FILES=$(git log --since="7 days ago" --name-only --pretty=format: | sort -u | grep -E '\.(tsx|jsx)$' | grep -E '^src/(pages|components)/')

# Components to check
COMPONENTS=(
    "Button"
    "Input"
    "Select"
    "SelectTrigger"
    "Switch"
    "TabsTrigger"
    "Link"
    "DropdownMenuItem"
    "DatePicker"
    "Textarea"
    "Checkbox"
    "RadioGroup"
)

# Counter for missing testids
MISSING_COUNT=0
TOTAL_COMPONENTS=0

echo "Checking the following recently modified files:"
echo "$RECENT_FILES" | head -20
echo ""

# Function to check if a line has data-testid
has_testid() {
    local file=$1
    local line_num=$2
    local context_lines=5
    
    # Check current line and next few lines for data-testid
    sed -n "${line_num},$((line_num + context_lines))p" "$file" | grep -q 'data-testid'
}

# Check each file
for file in $RECENT_FILES; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Checking: $file${NC}"
        file_missing=0
        
        # Check for Button, Input, Select, etc. without data-testid
        for component in "${COMPONENTS[@]}"; do
            while IFS=: read -r line_num line; do
                TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
                if ! has_testid "$file" "$line_num"; then
                    if [ $file_missing -eq 0 ]; then
                        echo -e "${RED}  Missing data-testid:${NC}"
                        file_missing=1
                    fi
                    echo "    Line $line_num: <$component"
                    MISSING_COUNT=$((MISSING_COUNT + 1))
                fi
            done < <(grep -n "<$component\s" "$file" || true)
        done
        
        # Check for onClick without data-testid
        while IFS=: read -r line_num line; do
            TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
            if ! has_testid "$file" "$line_num"; then
                if [ $file_missing -eq 0 ]; then
                    echo -e "${RED}  Missing data-testid:${NC}"
                    file_missing=1
                fi
                echo "    Line $line_num: onClick handler"
                MISSING_COUNT=$((MISSING_COUNT + 1))
            fi
        done < <(grep -n "onClick={" "$file" || true)
        
        if [ $file_missing -eq 0 ]; then
            echo -e "${GREEN}  ✓ All components have data-testid${NC}"
        fi
        echo ""
    fi
done

# Summary
echo "=== Summary ==="
echo "Total interactive components found: $TOTAL_COMPONENTS"
echo "Components missing data-testid: $MISSING_COUNT"

if [ $MISSING_COUNT -gt 0 ]; then
    echo -e "${RED}Action needed: Add data-testid to $MISSING_COUNT components${NC}"
else
    echo -e "${GREEN}Great! All components have data-testid attributes${NC}"
fi

# Generate report file
REPORT_FILE="missing-testids-report.txt"
echo "Generating detailed report: $REPORT_FILE"

{
    echo "Missing data-testid Report"
    echo "Generated: $(date)"
    echo "========================="
    echo ""
    
    for file in $RECENT_FILES; do
        if [ -f "$file" ]; then
            file_content=""
            
            for component in "${COMPONENTS[@]}"; do
                while IFS=: read -r line_num line; do
                    if ! has_testid "$file" "$line_num"; then
                        file_content="${file_content}Line $line_num: <$component - Missing data-testid\n"
                    fi
                done < <(grep -n "<$component\s" "$file" || true)
            done
            
            if [ -n "$file_content" ]; then
                echo "File: $file"
                echo -e "$file_content"
                echo ""
            fi
        fi
    done
} > "$REPORT_FILE"

echo ""
echo "Report saved to: $REPORT_FILE"