import { transformCompressedSfdt } from './sfdtUtils';

export const convertDocxFileToDfn = async (
  formData: FormData, setProgress: React.Dispatch<React.SetStateAction<number>>, 
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>, 
) => {
  // Use XMLHttpRequest to track upload progress
  const xhr = new XMLHttpRequest();

  // Create a promise to handle the XMLHttpRequest
  const conversionUrl = import.meta.env.VITE_DOCUMENT_UTILS_URL || "docufusiones-server.azurewebsites.net";
  const protocol = import.meta.env.VITE_DOCUMENT_UTILS_PROTOCOL || 'https';

  const uploadPromise = new Promise<any>((resolve, reject) => {
    // xhr.open("POST", "http://localhost:8000/api/documenteditor/import");
    xhr.open("POST", `${protocol}://${conversionUrl}/api/documenteditor/import`);
    // xhr.open("POST", "https://services.syncfusion.com/js/production/api/documenteditor/import");

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        console.log("Logging progress")
        const progress = Math.round((event.loaded / event.total * 0.5) * 100);
        setProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error occurred"));
    xhr.ontimeout = () => reject(new Error("Request timed out"));

    xhr.send(formData);
  });

  // try {
    const docObject = await uploadPromise;

    // Reset upload state after a short delay to show completed progress
    setTimeout(() => {
      if (setIsUploading) setIsUploading(false);
    }, 500);

    // Transform SFDT to remove checkbox content controls
    // This preserves the Unicode character while removing the content control wrapper
    // which fixes the issue where PDF exports show checkboxes as unchecked
    const transformedSfdt = await transformCompressedSfdt(docObject.sfdt);
    return transformedSfdt;
}
