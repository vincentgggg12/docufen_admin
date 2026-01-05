# Docufen Production Deployment Guide

This directory contains all necessary files and scripts to deploy Docufen to a production environment in Azure.

## Overview

The deployment process creates a complete Docufen infrastructure in Azure, excluding MongoDB components which have been removed from the original template. The deployment includes:

- Azure Cosmos DB (SQL API) for document storage
- Azure Storage Account for blob storage
- Azure App Service Plan and Web Apps
- Azure Static Web Apps for the frontend
- Azure Key Vault for secrets management
- Virtual Network with private endpoints
- Container Registry for Docker images
- Private DNS zones for secure connectivity
- **Azure Container Apps** for admin interface (optional)

## Prerequisites

1. **Azure Subscription** with appropriate permissions to create resources
2. **Azure CLI** (version 2.50.0 or higher) or **PowerShell** with Az modules
3. **Python 3.x** (for template cleaning script)
4. **Appropriate Azure RBAC roles**: Contributor or Owner on the subscription/resource group

## Files in this Directory

- `template-with-mongo.json` - Original ARM template (includes MongoDB resources)
- `template-production.json` - Cleaned ARM template (MongoDB resources removed)
- `template-production-with-containerapp.json` - Production template with Container App
- `parameters-production.json` - Production parameters file
- `parameters-production-containerapp.json` - Parameters file with Container App settings
- `clean-template.py` - Python script to remove MongoDB resources from template
- `add-container-app.py` - Python script to add Container App resources
- `Deploy-DocufenProduction.ps1` - PowerShell deployment script
- `deploy-docufen-production.sh` - Bash deployment script for Azure CLI

## Deployment Steps

### Option 1: Using PowerShell

```powershell
# 1. Connect to Azure
Connect-AzAccount

# 2. Select subscription (if you have multiple)
Set-AzContext -Subscription "YOUR-SUBSCRIPTION-ID"

# 3. Deploy to production (without Container App)
.\Deploy-DocufenProduction.ps1 -ResourceGroupName "rg-docufen-prod" -Location "westeurope"

# 4. Deploy with Container App for admin interface
.\Deploy-DocufenProduction.ps1 -ResourceGroupName "rg-docufen-prod" -Location "westeurope" -IncludeContainerApp

# 5. Validate only (without deploying)
.\Deploy-DocufenProduction.ps1 -ResourceGroupName "rg-docufen-prod" -ValidateOnly
```

### Option 2: Using Azure CLI (Bash)

```bash
# 1. Login to Azure
az login

# 2. Set subscription (if you have multiple)
az account set --subscription "YOUR-SUBSCRIPTION-ID"

# 3. Deploy to production (without Container App)
./deploy-docufen-production.sh -g rg-docufen-prod -l westeurope

# 4. Deploy with Container App for admin interface
./deploy-docufen-production.sh -g rg-docufen-prod -l westeurope -c

# 5. Validate only (without deploying)
./deploy-docufen-production.sh -g rg-docufen-prod -v
```

## Customizing Parameters

Edit `parameters-production.json` to customize resource names and configurations:

```json
{
  "parameters": {
    "sites_docufen_staging_name": {
      "value": "your-custom-app-name"
    },
    // ... other parameters
  }
}
```

### Important Naming Constraints

- Storage account names: 3-24 characters, lowercase letters and numbers only
- Key Vault names: 3-24 characters, alphanumeric and hyphens
- App Service names: Must be globally unique
- Container Registry names: 5-50 characters, alphanumeric only

## Post-Deployment Configuration

After successful deployment:

1. **Configure App Service Settings**
   ```bash
   az webapp config appsettings set \
     --resource-group rg-docufen-prod \
     --name docufen-prod \
     --settings KEY=VALUE
   ```

2. **Set up Cosmos DB Collections**
   - The deployment creates the Cosmos DB account but not the collections
   - Use the Azure Portal or scripts to create required collections

3. **Configure Key Vault Access Policies**
   ```bash
   az keyvault set-policy \
     --name docufen-prod-kv \
     --resource-group rg-docufen-prod \
     --object-id YOUR-APP-OBJECT-ID \
     --secret-permissions get list
   ```

4. **Deploy Application Code**
   - Use GitHub Actions, Azure DevOps, or direct deployment
   - Ensure connection strings reference Key Vault secrets

## Cleaning MongoDB Resources

If you have a new template that includes MongoDB resources, use the cleaning script:

```bash
python3 clean-template.py input-template.json output-template.json
```

This removes:
- MongoDB Cosmos DB accounts
- MongoDB-specific private endpoints
- MongoDB DNS zones
- MongoDB subnets in virtual networks
- MongoDB-related Key Vault secrets

## Troubleshooting

### Common Issues

1. **Naming Conflicts**
   - Error: "Name already taken"
   - Solution: Modify resource names in parameters file

2. **Insufficient Permissions**
   - Error: "AuthorizationFailed"
   - Solution: Ensure you have Contributor/Owner role

3. **Region Availability**
   - Error: "LocationNotAvailableForResourceType"
   - Solution: Choose a different region or check service availability

### Deployment Logs

- PowerShell: Check verbose output with `-Verbose` flag
- Azure CLI: Add `--debug` flag for detailed logs
- Azure Portal: Activity Log in resource group

## Cost Optimization

To minimize costs in production:

1. **App Service Plan**: Start with B1 or S1, scale up as needed
2. **Cosmos DB**: Use provisioned throughput with autoscale
3. **Storage**: Use lifecycle policies to move old data to cool/archive tiers
4. **Static Web App**: Free tier supports custom domains

## Security Best Practices

1. **Enable Private Endpoints** for all services
2. **Use Managed Identities** for service-to-service authentication
3. **Store secrets in Key Vault**, never in app settings
4. **Enable diagnostic logging** for all services
5. **Configure network security groups** on subnets
6. **Enable Azure Defender** for enhanced security

## Monitoring and Alerts

After deployment, set up:

1. **Application Insights** for application monitoring
2. **Log Analytics Workspace** for centralized logging
3. **Alerts** for:
   - High resource utilization
   - Failed requests
   - Security events
   - Cost thresholds

## Backup and Disaster Recovery

1. **Cosmos DB**: Automatic backups enabled, configure retention
2. **Storage Account**: Enable blob versioning and soft delete
3. **Key Vault**: Enable soft delete and purge protection
4. **Consider**: Cross-region replication for critical components

## Container App Configuration

The deployment optionally includes an Azure Container App for hosting the admin interface. This provides:

### Features
- **Public Internet Access**: The admin interface is accessible from the internet with a secure HTTPS endpoint
- **Private Connectivity**: Uses managed identity to securely connect to Key Vault and Cosmos DB
- **Auto-scaling**: Scales from 1 to 10 instances based on HTTP traffic
- **Continuous Updates**: Deploy new versions without affecting the main application

### Deployment
```bash
# Deploy with Container App
./deploy-docufen-production.sh -g rg-docufen-prod -c

# Deploy with custom container image
./deploy-docufen-production.sh -g rg-docufen-prod -c -i "docufenprod.azurecr.io/admin:v1.0"
```

### Post-Deployment Steps for Container App

1. **Build and Push Admin Interface Image**
```bash
# Build your admin interface
docker build -t docufenprod.azurecr.io/docufen-admin:latest ./admin-app

# Login to ACR
az acr login --name docufenprod

# Push image
docker push docufenprod.azurecr.io/docufen-admin:latest
```

2. **Update Container App with New Image**
```bash
az containerapp update \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod \
  --image docufenprod.azurecr.io/docufen-admin:latest
```

3. **Configure Environment Variables**
```bash
az containerapp update \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod \
  --set-env-vars \
    "API_KEY=secretref:api-key" \
    "NODE_ENV=production"
```

### Container App Architecture

The Container App deployment includes:
- **Managed Environment**: Isolated environment with VNet integration
- **Log Analytics**: Centralized logging for monitoring
- **Managed Identity**: System-assigned identity for secure resource access
- **Role Assignments**:
  - ACR Pull permission for container registry
  - Key Vault Secrets User for accessing secrets
  - Cosmos DB Data Contributor for database access

### Security Considerations

1. **Network Isolation**: Container App environment is deployed in a dedicated subnet
2. **Private Endpoints**: Uses private endpoints to access Key Vault and Cosmos DB
3. **Managed Identity**: No credentials stored in code or configuration
4. **HTTPS Only**: All traffic is encrypted with automatic SSL certificates

## Support

For issues or questions:
- Check Azure service health: https://status.azure.com
- Review deployment logs in Azure Portal
- Container Apps documentation: https://docs.microsoft.com/azure/container-apps/
- Contact your Azure support team