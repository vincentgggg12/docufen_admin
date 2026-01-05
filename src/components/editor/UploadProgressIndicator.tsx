import React from 'react';
import { useTranslation } from 'react-i18next';

interface UploadProgressIndicatorProps {
  isUploading: boolean;
  uploadProgress: number;
  isConverting?: boolean;
}

const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = ({
  isUploading,
  uploadProgress,
}) => {
  const { t } = useTranslation();

  if (!isUploading) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 max-w-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {t('mPopup.attachments.uploading')}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {uploadProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300 ease-out bg-blue-600"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadProgressIndicator;