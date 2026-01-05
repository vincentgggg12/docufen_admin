/**
 * Feature flags for controlling application features
 */
export const features = {
  /**
   * Enable direct blob upload for attachments
   * When true, files are uploaded directly to Azure Blob Storage
   * When false, files are uploaded through the server
   */
  ENABLE_DIRECT_UPLOAD: true,
  
  /**
   * Maximum file size for traditional upload (through server)
   * Files larger than this will always use direct upload if enabled
   */
  TRADITIONAL_UPLOAD_MAX_SIZE: 2 * 1024 * 1024, // 2MB
};