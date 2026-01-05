# Performance Profiling Guide

## Overview

The Performance Profiler is a tool to measure and analyze function execution times in the Docufen Client application. It helps identify performance bottlenecks, especially in cell selection operations on large documents.

## Quick Start

### 1. Enable the Profiler

Open the browser console and run:

```javascript
profiler.enable()
```

The profiler is automatically enabled in development mode.

### 2. Perform Actions

Click on a table cell in a document. The profiler will automatically log timing information.

### 3. View Results

After clicking a cell, you'll see detailed timing information in the console:

```
⏱️ selectCell TOTAL: 1245.67ms

🔍 Performance Profile Results
  selectCell: 1245.67ms
    selectCell: Get state: 0.25ms
    selectCell: Call deselectCell: 620.34ms
      deselectCell: 620.34ms
        deselectCell: SELECT PREVIOUS CELL (tree traversal): 310.12ms
        deselectCell: SELECT BACK TO CURRENT (tree traversal): 305.89ms
        ...
    selectCell: Set cell background color: 0.45ms
    ...
```

## Console Commands

### Basic Commands

```javascript
// Enable/disable profiler
profiler.enable()
profiler.disable()

// Check if enabled
profiler.isEnabled()

// Print detailed results (optional: threshold in ms)
profiler.print()        // Show all operations
profiler.print(10)      // Show only operations > 10ms
profiler.print(100)     // Show only operations > 100ms

// Print summary statistics
profiler.summary()

// Clear profiling data
profiler.clear()
```

### Example Session

```javascript
// 1. Enable profiler
profiler.enable()

// 2. Click on a table cell (performs the action)
// ... timing logs appear automatically ...

// 3. View summary
profiler.summary()
/*
📊 Performance Summary
Total Operations: 47
Total Time: 1245.67ms

Top 10 Slowest Operations:
  1. deselectCell: SELECT PREVIOUS CELL (tree traversal): 310.12ms
  2. deselectCell: SELECT BACK TO CURRENT (tree traversal): 305.89ms
  3. selectCell: Call deselectCell: 620.34ms
  ...
*/

// 4. Clear data for next test
profiler.clear()
```

## Understanding the Output

### Color Coding

The profiler uses colors to indicate performance levels:

- **Green** (< 1ms): Fast, no issues
- **Light Green** (1-10ms): Good performance
- **Yellow** (10-50ms): Warning, may be noticeable
- **Orange** (50-100ms): Slow, user may notice lag
- **Deep Orange** (100-500ms): Very slow, noticeable delay
- **Red** (> 500ms): Critical, major performance issue

### Reading the Tree Structure

```
selectCell: 1245.67ms                    ← Total time for selectCell function
  selectCell: Get state: 0.25ms          ← Fast operation (green)
  selectCell: Call deselectCell: 620.34ms ← Slowest operation (orange/red)
    deselectCell: 620.34ms               ← Nested group showing breakdown
      deselectCell: SELECT PREVIOUS...   ← The actual slow operation
```

### Key Operations to Watch

**Critical Operations** (these are the slow ones in large documents):

1. `deselectCell: SELECT PREVIOUS CELL (tree traversal)` - Selecting previous cell by hierarchical index
2. `deselectCell: SELECT BACK TO CURRENT (tree traversal)` - Returning selection to current position
3. `selectCell: Set cell background color` - Setting the cell color

**Expected Fast Operations** (should be < 1ms):

- Get state operations
- Color checking
- Setting boolean flags

## Testing Different Document Sizes

### Small Document (< 10 pages)
Expected times:
- `selectCell TOTAL`: < 50ms
- Tree traversal operations: < 10ms each

### Medium Document (10-30 pages)
Expected times:
- `selectCell TOTAL`: 50-300ms
- Tree traversal operations: 25-150ms each

### Large Document (50+ pages)
Current performance (SLOW):
- `selectCell TOTAL`: 1000-4000ms
- Tree traversal operations: 500-2000ms each

Target performance:
- `selectCell TOTAL`: < 100ms
- Tree traversal operations: < 50ms each

## Advanced Usage

### Profile Custom Code

If you want to add profiling to other parts of the code:

```typescript
import { profiler, ProfilerGroup } from '@/lib/performanceProfiler';

function myFunction() {
  const group = new ProfilerGroup('myFunction');

  let op = profiler.start('myFunction: Step 1');
  // ... do work ...
  profiler.end(op);

  op = profiler.start('myFunction: Step 2');
  // ... do work ...
  profiler.end(op);

  const totalTime = group.end();
  console.log(`Total time: ${totalTime}ms`);
}
```

### Profile Async Operations

```typescript
import { profiler } from '@/lib/performanceProfiler';

async function myAsyncFunction() {
  await profiler.profileAsync('fetch data', async () => {
    const response = await fetch('/api/data');
    return response.json();
  });
}
```

### Profile Without Manual Start/End

```typescript
import { profiler } from '@/lib/performanceProfiler';

function calculate() {
  return profiler.profile('calculate sum', () => {
    return array.reduce((sum, n) => sum + n, 0);
  });
}
```

## Troubleshooting

### Profiler not logging anything

1. Check if it's enabled:
   ```javascript
   profiler.isEnabled()  // Should return true
   ```

2. If false, enable it:
   ```javascript
   profiler.enable()
   ```

3. Refresh the page and try again

### Too much output

Filter by threshold:
```javascript
profiler.print(100)  // Only show operations > 100ms
```

### Want to analyze specific operation

1. Clear old data:
   ```javascript
   profiler.clear()
   ```

2. Perform the specific action (e.g., click one cell)

3. View results:
   ```javascript
   profiler.print()
   profiler.summary()
   ```

## Integration with Cell Selection

The profiler is already integrated into:

- **`useCellSelection` hook** ([CellSelection.ts](src/hooks/CellSelection.ts))
  - `selectCell()` function
  - `deselectCell()` function

Every time you click a table cell, you'll automatically see:
1. Individual operation times
2. Total `selectCell` time
3. Total `deselectCell` time
4. Detailed breakdown of all sub-operations

## Performance Goals

Based on profiling, here are the optimization targets:

### Current Performance Issues

1. **Tree Traversal in `editor.selection.select()`**
   - Current: 300-2000ms per call in large docs
   - Target: < 10ms
   - Solution: Use direct widget API instead of hierarchical index

2. **Double Selection Overhead**
   - Current: Called twice per cell click (deselect old + select new)
   - Target: Single operation or async deselection
   - Solution: Optimize deselection or make it non-blocking

### Success Metrics

After optimization, target times for **50+ page documents**:

- `selectCell TOTAL`: < 100ms (currently 1000-4000ms)
- `SELECT PREVIOUS CELL`: < 10ms (currently 300-2000ms)
- `SELECT BACK TO CURRENT`: < 10ms (currently 300-2000ms)
- Cell highlight visible: < 50ms (instant user feedback)

## Comparing Before/After Optimizations

To compare performance before and after changes:

```javascript
// Before changes
profiler.clear()
// Click a cell
profiler.summary()
// Take note of "Total Time" and "Top 10 Slowest Operations"

// Make code changes...

// After changes
profiler.clear()
// Click the same cell in the same document
profiler.summary()
// Compare the numbers
```

## Additional Tools

### Browser DevTools Performance Tab

For more detailed analysis:

1. Open Chrome DevTools (F12)
2. Go to "Performance" tab
3. Click Record (●)
4. Click a table cell
5. Stop recording
6. Analyze the flame graph

Look for:
- Long JavaScript tasks (yellow blocks)
- Layout/rendering operations (purple blocks)
- Time spent in specific functions

### React DevTools Profiler

For React component render times:

1. Install React DevTools extension
2. Open DevTools → "Profiler" tab
3. Click Record
4. Perform action
5. Stop recording
6. Analyze component render times

## File Locations

- **Profiler Implementation**: [src/lib/performanceProfiler.ts](src/lib/performanceProfiler.ts)
- **Cell Selection Integration**: [src/hooks/CellSelection.ts](src/hooks/CellSelection.ts)
- **This Guide**: [PERFORMANCE_PROFILING.md](PERFORMANCE_PROFILING.md)

## Support

For questions or issues with the profiler, check the console for error messages or contact the development team.
