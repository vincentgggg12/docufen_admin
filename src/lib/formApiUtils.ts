import { SERVERURL } from "./server";
import { 
  Template, 
  TemplateResponse, 
  TemplatesResponse,
} from "./types/documents";
import { getAuthorization } from "./apiUtils";

const BEARER = "Bearer ";

// TEMPLATE MANAGEMENT FUNCTIONS

/**
 * Fetch all templates for a tenant
 * @param tenantName Tenant name
 * @param type Optional template type filter
 * @returns Promise with templates response
 */
export const fetchTemplates = async (
  tenantName: string,
  type?: string
): Promise<TemplatesResponse> => {
  let url = `${SERVERURL}templates/${tenantName}/`;
  if (type) {
    url += `?type=${type}`;
  }
  
  try {
    const authorization = await getAuthorization();
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: BEARER + authorization,
      },
      credentials: "include",
    });
    
    if (res.status === 200) {
      const data = await res.json() as TemplatesResponse;
      return data;
    } else {
      return { success: false, templates: [], error: `Failed to fetch templates: ${res.status}` };
    }
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, templates: [], error: "An error occurred while fetching templates" };
  }
};

/**
 * Fetch a specific template by ID
 * @param tenantName Tenant name
 * @param templateId Template ID
 * @returns Promise with template response
 */
export const fetchTemplate = async (
  tenantName: string,
  templateId: string
): Promise<TemplateResponse> => {
  const url = `${SERVERURL}templates/${tenantName}/${templateId}/`;
  
  try {
    const authorization = await getAuthorization();
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: BEARER + authorization,
      },
      credentials: "include",
    });
    
    if (res.status === 200) {
      const data = await res.json() as TemplateResponse;
      return data;
    } else {
      return { success: false, error: `Failed to fetch template: ${res.status}` };
    }
  } catch (error) {
    console.error("Error fetching template:", error);
    return { success: false, error: "An error occurred while fetching template" };
  }
};

/**
 * Create a new template
 * @param tenantName Tenant name
 * @param template Template data
 * @param file Template document file
 * @returns Promise with template response
 */
export const createTemplate = async (
  tenantName: string,
  template: Partial<Template>,
  docString: string
): Promise<TemplateResponse> => {
  const url = `${SERVERURL}templates/${tenantName}/`;
  const formData = new FormData();
  
  // Add file to form data
  formData.append("docString", docString);
  
  // Add template data as JSON
  formData.append("templateData", JSON.stringify({
    ...template,
    tenantName,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  try {
    const authorization = await getAuthorization();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: BEARER + authorization,
      },
      body: formData,
      credentials: "include",
    });
    
    if (res.status === 201) {
      const data = await res.json() as TemplateResponse;
      return data;
    } else {
      return { success: false, error: `Failed to create template: ${res.status}` };
    }
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, error: "An error occurred while creating template" };
  }
};

/**
 * Update an existing template
 * @param tenantName Tenant name
 * @param templateId Template ID
 * @param template Template data to update
 * @param file Optional new template document file
 * @returns Promise with template response
 */
export const updateTemplate = async (
  tenantName: string,
  templateId: string,
  template: Partial<Template>,
  file?: File
): Promise<TemplateResponse> => {
  const url = `${SERVERURL}templates/${tenantName}/${templateId}/`;
  const formData = new FormData();
  
  // Add template data as JSON
  formData.append("templateData", JSON.stringify({
    ...template,
    updatedAt: new Date()
  }));
  
  // Add file to form data if provided
  if (file) {
    formData.append("file", file);
  }
  
  try {
    const authorization = await getAuthorization();
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: BEARER + authorization,
      },
      body: formData,
      credentials: "include",
    });
    
    if (res.status === 200) {
      const data = await res.json() as TemplateResponse;
      return data;
    } else {
      return { success: false, error: `Failed to update template: ${res.status}` };
    }
  } catch (error) {
    console.error("Error updating template:", error);
    return { success: false, error: "An error occurred while updating template" };
  }
};

/**
 * Delete a template
 * @param tenantName Tenant name
 * @param templateId Template ID
 * @returns Promise with success status
 */
export const deleteTemplate = async (
  tenantName: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> => {
  const url = `${SERVERURL}templates/${tenantName}/${templateId}/`;
  
  try {
    const authorization = await getAuthorization();
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: BEARER + authorization,
      },
      credentials: "include",
    });
    
    if (res.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `Failed to delete template: ${res.status}` };
    }
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false, error: "An error occurred while deleting template" };
  }
};
