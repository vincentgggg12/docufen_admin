#!/bin/bash

# Script to find interactive UI elements missing data-testid attributes
# Usage: ./find-missing-testids.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories to search
SEARCH_DIRS="src/pages src/components"

# Output file for results
OUTPUT_FILE="missing-testids-report.txt"
CSV_FILE="missing-testids.csv"

# Initialize counters
total_missing=0
declare -A file_counts

# Function to check if a component has data-testid within reasonable proximity
check_has_testid() {
    local file="$1"
    local line_num="$2"
    local component="$3"
    
    # Get context (5 lines before and after)
    local context_start=$((line_num - 5))
    local context_end=$((line_num + 5))
    
    # Extract the component block (handle multi-line components)
    local component_text=$(sed -n "${line_num}p" "$file")
    local current_line=$line_num
    local open_brackets=1
    local close_brackets=0
    
    # Find the closing > of the component
    while [ $open_brackets -gt $close_brackets ] && [ $current_line -lt $((line_num + 50)) ]; do
        local line_content=$(sed -n "${current_line}p" "$file" 2>/dev/null)
        component_text+=" $line_content"
        
        # Count brackets
        open_brackets=$((open_brackets + $(echo "$line_content" | grep -o '<' | wc -l)))
        close_brackets=$((close_brackets + $(echo "$line_content" | grep -o '>' | wc -l)))
        
        # Check if we have data-testid in this component
        if echo "$line_content" | grep -q 'data-testid'; then
            return 0
        fi
        
        # Break if we've found the closing >
        if echo "$line_content" | grep -q '>'; then
            break
        fi
        
        current_line=$((current_line + 1))
    done
    
    # Component doesn't have data-testid
    return 1
}

# Function to process a file
process_file() {
    local file="$1"
    local file_missing=0
    
    # Skip test files
    if [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]]; then
        return
    fi
    
    # Interactive components to check
    local components=(
        "Button"
        "Input"
        "Select"
        "Switch"
        "TabsTrigger"
        "DropdownMenuItem"
        "DropdownMenuTrigger"
        "Link"
        "Checkbox"
        "RadioGroup"
        "Textarea"
        "Toggle"
        "Slider"
        "DatePicker"
        "DialogTrigger"
        "DrawerTrigger"
        "PopoverTrigger"
        "SheetTrigger"
        "AlertDialogTrigger"
        "CollapsibleTrigger"
    )
    
    # Check each component type
    for component in "${components[@]}"; do
        # Find all instances of the component
        grep -n "<$component\b" "$file" 2>/dev/null | while IFS=: read -r line_num line_content; do
            # Skip commented lines
            if echo "$line_content" | grep -q '^\s*//\|^\s*/\*'; then
                continue
            fi
            
            # Check if this component has data-testid
            if ! check_has_testid "$file" "$line_num" "$component"; then
                echo -e "${RED}Missing data-testid:${NC} $file:$line_num - <$component>" >> "$OUTPUT_FILE"
                echo "$file,$line_num,$component,$(echo "$line_content" | sed 's/,/;/g' | sed 's/^[[:space:]]*//' | cut -c1-100)" >> "$CSV_FILE"
                file_missing=$((file_missing + 1))
                total_missing=$((total_missing + 1))
            fi
        done
    done
    
    # Check for onClick handlers without nearby data-testid
    grep -n "onClick\s*=" "$file" 2>/dev/null | while IFS=: read -r line_num line_content; do
        # Skip commented lines
        if echo "$line_content" | grep -q '^\s*//\|^\s*/\*'; then
            continue
        fi
        
        # Look for the parent element (search backwards)
        local parent_line=$line_num
        local found_element=false
        local element_start=""
        
        while [ $parent_line -gt $((line_num - 20)) ] && [ $parent_line -gt 0 ]; do
            local prev_line=$(sed -n "${parent_line}p" "$file" 2>/dev/null)
            if echo "$prev_line" | grep -q '<[A-Z][a-zA-Z]*\|<[a-z][a-zA-Z]*'; then
                element_start=$prev_line
                found_element=true
                break
            fi
            parent_line=$((parent_line - 1))
        done
        
        if [ "$found_element" = true ]; then
            if ! check_has_testid "$file" "$parent_line" "onClick"; then
                echo -e "${YELLOW}onClick without data-testid:${NC} $file:$line_num" >> "$OUTPUT_FILE"
                echo "$file,$line_num,onClick,$(echo "$line_content" | sed 's/,/;/g' | sed 's/^[[:space:]]*//' | cut -c1-100)" >> "$CSV_FILE"
                file_missing=$((file_missing + 1))
                total_missing=$((total_missing + 1))
            fi
        fi
    done
    
    # Check for <a> tags without data-testid
    grep -n '<a\s' "$file" 2>/dev/null | while IFS=: read -r line_num line_content; do
        # Skip commented lines
        if echo "$line_content" | grep -q '^\s*//\|^\s*/\*'; then
            continue
        fi
        
        if ! check_has_testid "$file" "$line_num" "a"; then
            echo -e "${RED}Missing data-testid:${NC} $file:$line_num - <a> tag" >> "$OUTPUT_FILE"
            echo "$file,$line_num,a,$(echo "$line_content" | sed 's/,/;/g' | sed 's/^[[:space:]]*//' | cut -c1-100)" >> "$CSV_FILE"
            file_missing=$((file_missing + 1))
            total_missing=$((total_missing + 1))
        fi
    done
    
    # Store count for this file
    if [ $file_missing -gt 0 ]; then
        file_counts["$file"]=$file_missing
    fi
}

# Main execution
echo -e "${BLUE}=== Finding Interactive Elements Missing data-testid ===${NC}"
echo ""

# Clean previous reports
> "$OUTPUT_FILE"
> "$CSV_FILE"

# Add CSV header
echo "File,Line,Component,Context" > "$CSV_FILE"

# Add report header
echo "=== Missing data-testid Report ===" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Process all TypeScript/JavaScript files
for dir in $SEARCH_DIRS; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}Scanning directory: $dir${NC}"
        find "$dir" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) | while read -r file; do
            process_file "$file"
        done
    fi
done

# Generate summary
echo "" >> "$OUTPUT_FILE"
echo "=== Summary ===" >> "$OUTPUT_FILE"
echo "Total missing data-testid attributes: $total_missing" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Files with most missing testids:" >> "$OUTPUT_FILE"

# Sort files by missing count
for file in "${!file_counts[@]}"; do
    echo "${file_counts[$file]} $file"
done | sort -rn | head -20 >> "$OUTPUT_FILE"

# Terminal output summary
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "Total missing data-testid attributes: ${RED}$total_missing${NC}"
echo ""
echo -e "${YELLOW}Top files with missing testids:${NC}"
for file in "${!file_counts[@]}"; do
    echo "${file_counts[$file]} $file"
done | sort -rn | head -10

echo ""
echo -e "${GREEN}Full report saved to:${NC} $OUTPUT_FILE"
echo -e "${GREEN}CSV report saved to:${NC} $CSV_FILE"

# Create a focused report for recently modified files
if command -v git >/dev/null 2>&1; then
    echo ""
    echo -e "${BLUE}Checking recently modified files...${NC}"
    RECENT_REPORT="missing-testids-recent.txt"
    > "$RECENT_REPORT"
    
    echo "=== Recently Modified Files with Missing data-testid ===" >> "$RECENT_REPORT"
    echo "Files modified in the last 30 days:" >> "$RECENT_REPORT"
    echo "" >> "$RECENT_REPORT"
    
    # Get files modified in last 30 days
    git log --since="30 days ago" --name-only --pretty=format: | sort -u | grep -E '\.(tsx|jsx|ts|js)$' | while read -r file; do
        if [ -f "$file" ] && grep -q "$file" "$OUTPUT_FILE"; then
            echo "--- $file ---" >> "$RECENT_REPORT"
            grep "$file" "$OUTPUT_FILE" >> "$RECENT_REPORT"
            echo "" >> "$RECENT_REPORT"
        fi
    done
    
    echo -e "${GREEN}Recent files report saved to:${NC} $RECENT_REPORT"
fi