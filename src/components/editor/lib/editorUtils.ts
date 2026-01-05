import { DocumentEditor } from "@syncfusion/ej2-react-documenteditor";

export const convertBlobToDfnFormat = async (blob: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawString = reader.result as string
      const base64Data = rawString.split(",")[1]; // Remove the prefix (e.g., data:application/json;base64,)
      const decodedString = atob(base64Data);
      resolve(decodedString);
    }
    reader.onerror = (error) => {
      reject("Error reading Blob: " + error)
    }
    reader.readAsDataURL(blob); // Read the Blob as a Base64-encoded string
  })
}

export const getDocumentContent = async (editor: DocumentEditor) => {
  const blob = await editor.saveAsBlob("Sfdt")
  console.log("Getting Blob: ")
  if (!blob) {
    return ""
  }
  const docFormat = await convertBlobToDfnFormat(blob)
  return docFormat
}

export const getDocumentContentA = (editor: DocumentEditor) => {
  const stringObject = editor.serialize()
  return stringObject
}
