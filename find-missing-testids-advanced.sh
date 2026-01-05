#!/bin/bash

# Advanced script to find interactive UI elements missing data-testid attributes
# with better pattern matching and context awareness
# Usage: ./find-missing-testids-advanced.sh [--recent-only]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
RECENT_ONLY=false
if [[ "$1" == "--recent-only" ]]; then
    RECENT_ONLY=true
fi

# Directories to search
SEARCH_DIRS="src/pages src/components"

# Output files
OUTPUT_FILE="missing-testids-detailed.txt"
CSV_FILE="missing-testids-detailed.csv"
PRIORITY_FILE="missing-testids-priority.txt"

# Initialize counters and arrays
total_missing=0
declare -A file_counts
declare -A component_counts
declare -a priority_items

# Interactive components to check (expanded list)
COMPONENTS=(
    # Basic form elements
    "Button"
    "Input"
    "Select"
    "Textarea"
    "Checkbox"
    "RadioGroup"
    "Switch"
    "Toggle"
    "Slider"
    
    # Navigation
    "Link"
    "TabsTrigger"
    "TabsList"
    "NavigationMenuItem"
    "BreadcrumbItem"
    
    # Dropdowns and menus
    "DropdownMenuItem"
    "DropdownMenuTrigger"
    "DropdownMenuCheckboxItem"
    "DropdownMenuRadioItem"
    "SelectTrigger"
    "SelectItem"
    
    # Dialogs and modals
    "DialogTrigger"
    "AlertDialogTrigger"
    "AlertDialogAction"
    "AlertDialogCancel"
    "SheetTrigger"
    "DrawerTrigger"
    "PopoverTrigger"
    
    # Other interactive elements
    "CollapsibleTrigger"
    "AccordionTrigger"
    "CarouselNext"
    "CarouselPrevious"
    "CommandItem"
    "DatePicker"
    "Calendar"
    
    # Custom components that might be interactive
    "Card"
    "Avatar"
)

# Function to extract component with full context
extract_component_context() {
    local file="$1"
    local line_num="$2"
    local max_lines=20
    
    local result=""
    local current_line=$line_num
    local bracket_count=0
    local in_component=false
    
    while [ $current_line -le $((line_num + max_lines)) ]; do
        local line=$(sed -n "${current_line}p" "$file" 2>/dev/null)
        [ -z "$line" ] && break
        
        result+="$line"$'\n'
        
        # Track if we're inside the component
        if [[ "$line" =~ \< ]]; then
            bracket_count=$((bracket_count + 1))
            in_component=true
        fi
        
        if [[ "$line" =~ \> ]] && [ $in_component = true ]; then
            bracket_count=$((bracket_count - 1))
            if [ $bracket_count -eq 0 ]; then
                break
            fi
        fi
        
        # Check for self-closing tags
        if [[ "$line" =~ /\> ]]; then
            break
        fi
        
        current_line=$((current_line + 1))
    done
    
    echo "$result"
}

# Function to check if component has data-testid
check_component_testid() {
    local component_text="$1"
    
    # Check for data-testid in the component
    if echo "$component_text" | grep -q 'data-testid'; then
        return 0
    fi
    
    # Check for testId (alternative spelling)
    if echo "$component_text" | grep -q 'testId'; then
        return 0
    fi
    
    return 1
}

# Function to analyze component importance
get_component_priority() {
    local component="$1"
    local context="$2"
    local file="$3"
    
    # High priority components
    local high_priority=("Button" "Input" "Select" "Link" "Submit" "DialogTrigger" "DropdownMenuItem")
    
    # Check if it's a high priority component
    for hp in "${high_priority[@]}"; do
        if [[ "$component" == "$hp" ]]; then
            echo "HIGH"
            return
        fi
    done
    
    # Check if it has onClick, onSubmit, onChange handlers
    if echo "$context" | grep -qE 'onClick|onSubmit|onChange|onSelect'; then
        echo "HIGH"
        return
    fi
    
    # Check if it's in a form
    if echo "$context" | grep -qE 'form|Form|submit|Submit'; then
        echo "MEDIUM"
        return
    fi
    
    echo "LOW"
}

# Function to process a single file
process_file() {
    local file="$1"
    local file_missing=0
    local file_messages=""
    
    # Skip test files and type definition files
    if [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]] || [[ "$file" == *".d.ts" ]]; then
        return
    fi
    
    # Check each component type
    for component in "${COMPONENTS[@]}"; do
        # Find all instances, including multi-line
        grep -n "<$component\b" "$file" 2>/dev/null | while IFS=: read -r line_num line_content; do
            # Skip commented lines
            if echo "$line_content" | grep -qE '^\s*//|^\s*/\*|^\s*\*'; then
                continue
            fi
            
            # Extract full component context
            local context=$(extract_component_context "$file" "$line_num")
            
            # Check if it has data-testid
            if ! check_component_testid "$context"; then
                local priority=$(get_component_priority "$component" "$context" "$file")
                local short_context=$(echo "$line_content" | sed 's/^[[:space:]]*//' | cut -c1-80)
                
                # Add to reports
                echo "$file,$line_num,$component,$priority,\"$short_context\"" >> "$CSV_FILE"
                file_messages+="${priority}: Line $line_num - <$component> - $short_context\n"
                
                # Track counts
                file_missing=$((file_missing + 1))
                total_missing=$((total_missing + 1))
                component_counts["$component"]=$((${component_counts["$component"]:-0} + 1))
                
                # Add to priority list if HIGH
                if [[ "$priority" == "HIGH" ]]; then
                    priority_items+=("$file:$line_num - <$component>")
                fi
            fi
        done
    done
    
    # Check for onClick handlers without component wrapper
    grep -n "onClick\s*=" "$file" 2>/dev/null | while IFS=: read -r line_num line_content; do
        # Skip if already in our component check
        local already_checked=false
        for component in "${COMPONENTS[@]}"; do
            if echo "$line_content" | grep -q "<$component"; then
                already_checked=true
                break
            fi
        done
        
        if [ "$already_checked" = false ]; then
            # Look backwards for the parent element
            local parent_found=false
            local check_line=$((line_num - 1))
            local search_depth=10
            
            while [ $check_line -gt $((line_num - search_depth)) ] && [ $check_line -gt 0 ]; do
                local prev_line=$(sed -n "${check_line}p" "$file" 2>/dev/null)
                if echo "$prev_line" | grep -qE '<[a-zA-Z]+\b|<[A-Z][a-zA-Z]*\b'; then
                    local context=$(extract_component_context "$file" "$check_line")
                    if ! check_component_testid "$context"; then
                        local element=$(echo "$prev_line" | grep -oE '<[a-zA-Z]+\b' | head -1 | tr -d '<')
                        echo "$file,$line_num,onClick-on-$element,HIGH,\"onClick without testid\"" >> "$CSV_FILE"
                        file_messages+="HIGH: Line $line_num - onClick on <$element> without data-testid\n"
                        file_missing=$((file_missing + 1))
                        total_missing=$((total_missing + 1))
                        priority_items+=("$file:$line_num - onClick on <$element>")
                    fi
                    parent_found=true
                    break
                fi
                check_line=$((check_line - 1))
            done
        fi
    done
    
    # Store results for this file
    if [ $file_missing -gt 0 ]; then
        file_counts["$file"]=$file_missing
        echo -e "\n=== $file (${file_missing} missing) ===" >> "$OUTPUT_FILE"
        echo -e "$file_messages" >> "$OUTPUT_FILE"
    fi
}

# Function to generate priority report
generate_priority_report() {
    echo "=== HIGH PRIORITY: Interactive Elements Missing data-testid ===" > "$PRIORITY_FILE"
    echo "These elements should be fixed first as they are critical for testing" >> "$PRIORITY_FILE"
    echo "" >> "$PRIORITY_FILE"
    
    printf '%s\n' "${priority_items[@]}" | sort -u >> "$PRIORITY_FILE"
    
    echo "" >> "$PRIORITY_FILE"
    echo "Total high priority items: ${#priority_items[@]}" >> "$PRIORITY_FILE"
}

# Main execution
echo -e "${BLUE}=== Advanced Search for Missing data-testid Attributes ===${NC}"
echo ""

# Clean previous reports
> "$OUTPUT_FILE"
> "$CSV_FILE"
> "$PRIORITY_FILE"

# Add headers
echo "File,Line,Component,Priority,Context" > "$CSV_FILE"
echo "=== Detailed Missing data-testid Report ===" > "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Get list of files to process
if [ "$RECENT_ONLY" = true ] && command -v git >/dev/null 2>&1; then
    echo -e "${YELLOW}Scanning only recently modified files (last 30 days)...${NC}"
    FILES=$(git log --since="30 days ago" --name-only --pretty=format: | sort -u | grep -E '\.(tsx|jsx|ts|js)$' | grep -E "^(src/pages|src/components)")
else
    echo -e "${GREEN}Scanning all files in $SEARCH_DIRS...${NC}"
    FILES=$(find $SEARCH_DIRS -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) 2>/dev/null)
fi

# Process each file
echo "$FILES" | while read -r file; do
    [ -f "$file" ] && process_file "$file"
done

# Generate reports
generate_priority_report

# Summary section
echo "" >> "$OUTPUT_FILE"
echo "=== SUMMARY ===" >> "$OUTPUT_FILE"
echo "Total missing data-testid attributes: $total_missing" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Component frequency
echo "=== Components Missing data-testid (by frequency) ===" >> "$OUTPUT_FILE"
for component in "${!component_counts[@]}"; do
    echo "${component_counts[$component]} - $component"
done | sort -rn >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "=== Files with Most Missing testids ===" >> "$OUTPUT_FILE"
for file in "${!file_counts[@]}"; do
    echo "${file_counts[$file]} - $file"
done | sort -rn | head -20 >> "$OUTPUT_FILE"

# Terminal summary
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "Total missing data-testid attributes: ${RED}$total_missing${NC}"
echo ""

echo -e "${PURPLE}Component breakdown:${NC}"
for component in "${!component_counts[@]}"; do
    echo "${component_counts[$component]} - $component"
done | sort -rn | head -10

echo ""
echo -e "${YELLOW}Top files needing attention:${NC}"
for file in "${!file_counts[@]}"; do
    echo "${file_counts[$file]} - $file"
done | sort -rn | head -5

echo ""
echo -e "${CYAN}High priority items: ${#priority_items[@]}${NC}"
echo ""
echo -e "${GREEN}Reports generated:${NC}"
echo " - Full report: $OUTPUT_FILE"
echo " - CSV export: $CSV_FILE"
echo " - Priority items: $PRIORITY_FILE"

# Quick fix generator option
echo ""
echo -e "${BLUE}Generate quick-fix snippets? (y/n)${NC}"
read -r generate_fixes

if [[ "$generate_fixes" == "y" ]]; then
    FIXES_FILE="testid-fixes.txt"
    > "$FIXES_FILE"
    
    echo "=== Quick Fix Snippets ===" >> "$FIXES_FILE"
    echo "Add these data-testid attributes to your components:" >> "$FIXES_FILE"
    echo "" >> "$FIXES_FILE"
    
    # Generate common patterns
    echo "// For Buttons:" >> "$FIXES_FILE"
    echo 'data-testid="button-[action-name]"' >> "$FIXES_FILE"
    echo 'data-testid="submit-button"' >> "$FIXES_FILE"
    echo 'data-testid="cancel-button"' >> "$FIXES_FILE"
    echo "" >> "$FIXES_FILE"
    
    echo "// For Inputs:" >> "$FIXES_FILE"
    echo 'data-testid="input-[field-name]"' >> "$FIXES_FILE"
    echo 'data-testid="email-input"' >> "$FIXES_FILE"
    echo 'data-testid="password-input"' >> "$FIXES_FILE"
    echo "" >> "$FIXES_FILE"
    
    echo "// For Selects:" >> "$FIXES_FILE"
    echo 'data-testid="select-[option-type]"' >> "$FIXES_FILE"
    echo 'data-testid="category-select"' >> "$FIXES_FILE"
    echo "" >> "$FIXES_FILE"
    
    echo "// For Links:" >> "$FIXES_FILE"
    echo 'data-testid="link-[destination]"' >> "$FIXES_FILE"
    echo 'data-testid="nav-[page-name]"' >> "$FIXES_FILE"
    echo "" >> "$FIXES_FILE"
    
    echo -e "${GREEN}Fix snippets saved to:${NC} $FIXES_FILE"
fi