import { BlockBlobClient } from '@azure/storage-blob';
import { apiRequest } from '@/lib/apiUtils';
import { SERVERURL } from '@/lib/server';

export interface SASTokenResponse {
  status: string;
  sasUrl: string;
  blobName: string;
  containerName: string;
  expiresIn: number;
  documentId: string;
  uniqueFilename: string;
}

export interface UploadCompleteRequest {
  blobName: string;
  uniqueFilename: string;
  originalFilename: string;
  fileSize: number;
  contentType: string;
}

export interface UploadCompleteResponse {
  status: string;
  pageCount: number;
  url: string;
  uniqueFilename: string;
  fileSize: number;
  conversionStatus?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Service for direct blob upload to Azure Storage
 */
export class DirectUploadService {
  /**
   * Request SAS token for direct upload
   */
  static async getSASToken(
    documentId: string,
    filename: string
  ): Promise<SASTokenResponse> {
    const response = await apiRequest(`${SERVERURL}upload/${documentId}/sas-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get upload token');
    }

    return response.json();
  }

  /**
   * Upload file directly to Azure Blob Storage
   */
  static async uploadToBlob(
    sasUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    const blockBlobClient = new BlockBlobClient(sasUrl);

    // Upload the file with progress tracking
    console.log("Uploading file to blob:", file.name, "SAS URL:", sasUrl);
    console.log("With progress tracking? ", !!onProgress);
    
    // Use smaller block size for more frequent progress updates
    const blockSize = file.size < 5 * 1024 * 1024 ? 512 * 1024 : // 256KB blocks for files < 5MB
                     file.size < 20 * 1024 * 1024 ? 1024 * 1024 : // 512KB blocks for files < 20MB
                     file.size < 100 * 1024 * 1024 ? 2 * 1024 * 1024 : // 1MB blocks for files < 100MB
                     4 * 1024 * 1024; // 4MB blocks for larger files
    
    const blockIds: string[] = [];
    let uploadedBytes = 0;
    const nBlocks = Math.ceil(file.size / blockSize);
    
    console.log("Nblocks:", nBlocks, "Block size:", blockSize, "File size:", file.size);
    
    // Upload blocks sequentially for more predictable progress
    for (let i = 0; i < nBlocks; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, file.size);
      const chunk = file.slice(start, end);
      
      // Skip empty chunks
      if (chunk.size === 0) {
        console.log("Skipping empty chunk at block", i);
        continue;
      }
      
      console.log(`Block ${i}: ${chunk.size} bytes (${start} - ${end})`);
      
      const blockId = btoa(`block-${i.toString().padStart(6, '0')}`);
      console.log("Staging block:", start, end, "Block ID:", blockId);
      
      try {
        await blockBlobClient.stageBlock(blockId, chunk, chunk.size);
        blockIds.push(blockId);
        uploadedBytes += chunk.size;
        
        if (onProgress) {
          console.log("uploadedBytes:", uploadedBytes, "of", file.size);
          onProgress({
            loaded: uploadedBytes,
            total: file.size,
            percentage: Math.round((uploadedBytes / file.size) * 100),
          });
        }
      } catch (error) {
        console.error(`Failed to upload block ${i}:`, error);
        throw error;
      }
    }
    
    console.log("Committing block list with", blockIds.length, "blocks");
    await blockBlobClient.commitBlockList(blockIds);
    console.log("Upload completed successfully:", file.name);
  }

  /**
   * Complete the upload by notifying the server
   */
  static async completeUpload(
    documentId: string,
    request: UploadCompleteRequest
  ): Promise<UploadCompleteResponse> {
    const response = await apiRequest(`${SERVERURL}upload/${documentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete upload');
    }

    return response.json();
  }

  /**
   * Full upload flow with direct blob upload
   */
  static async uploadFile(
    documentId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadCompleteResponse> {
    try {
      // Step 1: Get SAS token
      const sasToken = await this.getSASToken(documentId, file.name);
      console.log("SAS Token Response:", JSON.stringify(sasToken));
      // Step 2: Upload to blob
      await this.uploadToBlob(sasToken.sasUrl, file, onProgress);

      // Step 3: Complete upload
      const completeResponse = await this.completeUpload(documentId, {
        blobName: sasToken.blobName,
        uniqueFilename: sasToken.uniqueFilename,
        originalFilename: file.name,
        fileSize: file.size,
        contentType: file.type,
      });

      return completeResponse;
    } catch (error) {
      console.error('Direct upload failed:', error);
      throw error;
    }
  }
}