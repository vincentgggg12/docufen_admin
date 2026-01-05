# DocuEditor Azure Managed Application Deployment Guide

This document outlines the process for deploying the DocuEditor Azure Managed Application with the enhanced ARM template.

## Overview

The DocuEditor Managed Application deployment creates a fully isolated environment for each customer containing:

1. App Service Plan & App Service
2. Cosmos DB Account & Database
3. Storage Account with containers
4. Key Vault with access policies
5. Application Insights
6. Managed Identity with RBAC permissions

## Deployment Process

### Prerequisites

- Azure subscription with contributor rights
- Access to Azure Portal
- The `managedapp2.zip` package containing the ARM templates

### Steps to Deploy

1. **Package Preparation**
   - Ensure the `managedapp2.zip` contains:
     - `enhancedTemplate.json` (renamed to `mainTemplate.json`)
     - `createUiDefinition.json`

2. **Upload to Storage**
   - Create a storage account in Azure
   - Create a blob container with public read access
   - Upload the `managedapp2.zip` file
   - Copy the URL to the uploaded zip file

3. **Create Service Catalog Application Definition**
   - Navigate to "Service Catalog Managed Application Definitions" in Azure Portal
   - Click "Add"
   - Fill in the required information:
     - Name: DocuEditor Managed Application
     - Display name: DocuEditor Document Management
     - Description: Self-hosted document management solution
     - Package file URI: [URL from step 2]
     - Deployment Mode: Provider
     - Lock Level: ReadOnly
   - Configure authorization for your publisher tenant

4. **Test Deployment**
   - In the Azure Portal, navigate to "Marketplace"
   - Search for "DocuEditor"
   - Select your application and follow the deployment wizard
   - Fill in the parameters in each section
   - Review + Create to start deployment

5. **Validation**
   - Once deployment completes, verify all resources were created
   - Check resource group structure and configurations
   - Verify App Service is running correctly
   - Confirm Key Vault access is properly configured

## Parameters Reference

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| applicationName | Name of the DocuEditor application | DocuEditor |
| location | Azure region for deployment | Resource group location |
| storageAccountName | Name for the Storage Account | Generated from applicationName |
| storageAccountType | Type of Storage Account | Standard_LRS |
| cosmosDbAccountName | Name for Cosmos DB Account | Generated from applicationName |
| appServicePlanTier | App Service Plan SKU | P1v2 |
| appServicePlanInstances | Number of instances | 1 |
| tenantId | Azure AD Tenant ID | 11e9b0fe-e7f6-48fa-b2ee-8f7150b6ebb4 |
| clientId | Application (client) ID | fede27dc-61d8-4720-9219-bd3134af5734 |
| objectId | Object ID from Azure AD | 3ea55077-7319-47f3-9372-ba73d5aa1f15 |

## Troubleshooting

### Common Issues

1. **Deployment Failure**: 
   - Check Azure Activity Log for specific error messages
   - Verify parameter values are valid
   - Ensure your subscription has quota for the requested resources

2. **Resource Access Issues**:
   - Verify Managed Identity has correct RBAC permissions
   - Check Key Vault access policies
   - Ensure Storage Account firewall settings are correctly configured

3. **Application Not Starting**:
   - Check App Service logs
   - Verify connection strings in App Settings
   - Confirm Cosmos DB is properly initialized

## Next Steps

After successful deployment:
1. Access the App Service URL to complete initial setup
2. Configure user accounts and permissions
3. Set up document templates and workflows

For additional assistance, contact support@docueditor.com 