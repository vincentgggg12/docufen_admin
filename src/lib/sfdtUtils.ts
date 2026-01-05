import JSZip from 'jszip';

/**
 * SFDT Transformation Utilities
 *
 * Handles decompression, transformation, and recompression of SFDT documents
 * from the Syncfusion conversion service.
 *
 * The conversion service returns base64-encoded ZIP files containing JSON
 * with abbreviated property names.
 */

// Content control type values
const CONTENT_CONTROL_TYPES = {
  CheckBox: 2,
} as const;

/**
 * Decompresses base64-encoded SFDT ZIP to JSON string
 */
export async function decompressSfdt(compressedSfdt: string): Promise<string> {
  // Base64 decode to binary
  const binaryString = atob(compressedSfdt);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Extract from ZIP (the file inside is named "sfdt")
  const zip = await JSZip.loadAsync(bytes);
  const sfdtFile = zip.file('sfdt');
  if (!sfdtFile) {
    throw new Error('No sfdt file found in ZIP');
  }
  return await sfdtFile.async('string');
}

/**
 * Compresses JSON string back to base64-encoded SFDT ZIP
 */
export async function compressSfdt(jsonString: string): Promise<string> {
  const zip = new JSZip();
  zip.file('sfdt', jsonString);
  const compressed = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
  return compressed;
}

/**
 * Checks if SFDT content contains checkbox content controls
 */
export function hasCheckboxContentControls(sfdtJson: string): boolean {
  // Quick string check before parsing - look for the abbreviated property
  if (!sfdtJson.includes('"ccp"')) return false;
  // Check for checkbox type (t: 2)
  return sfdtJson.includes('"t":2');
}

/**
 * Recursively processes an array of inline elements, replacing checkbox content controls
 * with plain Unicode characters.
 */
function processInlines(inlines: any[]): any[] {
  const result: any[] = [];

  for (const inline of inlines) {
    // Check if this is a checkbox content control (ccp.t === 2)
    if (inline.ccp?.t === CONTENT_CONTROL_TYPES.CheckBox) {
      // This is a checkbox content control
      // Extract the inner content and add it directly (without the content control wrapper)
      if (inline.i && Array.isArray(inline.i)) {
        const innerInlines = processInlines(inline.i);
        result.push(...innerInlines);
      }
      // Skip the content control wrapper - we've extracted its contents
    } else if (inline.ccp) {
      // Other content control types - keep them but process inner content
      const processedInline = { ...inline };
      if (inline.i && Array.isArray(inline.i)) {
        processedInline.i = processInlines(inline.i);
      }
      result.push(processedInline);
    } else if (inline.i && Array.isArray(inline.i)) {
      // Has nested inlines but not a content control - process recursively
      const processedInline = { ...inline };
      processedInline.i = processInlines(inline.i);
      result.push(processedInline);
    } else {
      // Regular inline element - keep as is
      result.push(inline);
    }
  }

  return result;
}

/**
 * Recursively processes blocks (paragraphs, tables, etc.) to transform content controls
 */
function processBlocks(blocks: any[]): any[] {
  return blocks.map(block => {
    const processedBlock = { ...block };

    // Process inlines in the block (abbreviated: 'i')
    if (block.i && Array.isArray(block.i)) {
      processedBlock.i = processInlines(block.i);
    }

    // Process table rows if this is a table (abbreviated: 'r' for rows)
    if (block.r && Array.isArray(block.r)) {
      processedBlock.r = block.r.map((row: any) => {
        const processedRow = { ...row };
        // Cells are abbreviated as 'c'
        if (row.c && Array.isArray(row.c)) {
          processedRow.c = row.c.map((cell: any) => {
            const processedCell = { ...cell };
            // Blocks inside cells are abbreviated as 'b'
            if (cell.b && Array.isArray(cell.b)) {
              processedCell.b = processBlocks(cell.b);
            }
            return processedCell;
          });
        }
        return processedRow;
      });
    }

    // Process nested blocks if any (abbreviated: 'b')
    if (block.b && Array.isArray(block.b)) {
      processedBlock.b = processBlocks(block.b);
    }

    return processedBlock;
  });
}

/**
 * Processes header/footer content
 */
function processHeaderFooter(hf: any): any {
  if (!hf) return hf;

  const processed = { ...hf };
  // Abbreviated section names: h, f, eh, ef, fph, fpf
  const sections = ['h', 'f', 'eh', 'ef', 'fph', 'fpf'];

  for (const section of sections) {
    if (hf[section]?.b && Array.isArray(hf[section].b)) {
      processed[section] = {
        ...hf[section],
        b: processBlocks(hf[section].b)
      };
    }
  }

  return processed;
}

/**
 * Removes checkbox content controls from SFDT JSON, preserving the Unicode character.
 */
export function removeCheckboxContentControls(sfdtContent: string): string {
  try {
    const sfdt = JSON.parse(sfdtContent);

    // Process sections (abbreviated: 'sec')
    if (sfdt.sec && Array.isArray(sfdt.sec)) {
      sfdt.sec = sfdt.sec.map((section: any) => {
        const processedSection = { ...section };

        // Blocks in section (abbreviated: 'b')
        if (section.b && Array.isArray(section.b)) {
          processedSection.b = processBlocks(section.b);
        }

        // Headers/footers (abbreviated: 'hf')
        if (section.hf) {
          processedSection.hf = processHeaderFooter(section.hf);
        }

        return processedSection;
      });
    }

    return JSON.stringify(sfdt);
  } catch (error) {
    console.error('[SFDT Transform] Error transforming SFDT content:', error);
    // Return original content if transformation fails
    return sfdtContent;
  }
}

/**
 * Main entry point: decompress, transform, recompress
 *
 * This function:
 * 1. Decompresses the base64-encoded ZIP
 * 2. Checks if checkbox content controls exist
 * 3. If found, removes them while preserving the Unicode character
 * 4. Recompresses back to base64 ZIP format
 */
export async function transformCompressedSfdt(compressedSfdt: string): Promise<string> {
  try {
    const json = await decompressSfdt(compressedSfdt);

    if (!hasCheckboxContentControls(json)) {
      return compressedSfdt; // No transformation needed
    }

    console.log('[SFDT Transform] Removing checkbox content controls');
    const transformed = removeCheckboxContentControls(json);
    return await compressSfdt(transformed);
  } catch (error) {
    console.error('[SFDT Transform] Error during transformation:', error);
    // Return original content if transformation fails
    return compressedSfdt;
  }
}
