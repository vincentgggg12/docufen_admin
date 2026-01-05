# Docufen Production Deployment Plan

## Overview
Complete deployment plan for Docufen production environment with optional Container App for admin interface.

## Pre-Deployment Checklist

### 1. Clean Up Existing Resources
```bash
# Delete the resource group (WARNING: This deletes ALL resources)
az group delete --name rg-docufen-prod --yes --no-wait

# Wait for deletion to complete (check status)
az group exists --name rg-docufen-prod
```

### 2. Prepare Deployment Files
```bash
# Navigate to deployment directory
cd /home/billking/dual-workspace/docufen_client/deployment/production

# Clean and prepare templates
python3 clean-template.py
python3 add-container-app-v2.py
python3 fix-static-site-location.py
```

### 3. Verify Prerequisites
- [ ] Azure CLI installed and logged in: `az account show`
- [ ] Correct subscription selected: `az account set --subscription YOUR-SUBSCRIPTION-ID`
- [ ] Python 3.x available: `python3 --version`
- [ ] All scripts are executable: `chmod +x *.sh`

## Deployment Steps

### Phase 1: Base Infrastructure (Without Container App)

#### Step 1: Create Resource Group
```bash
az group create \
  --name rg-docufen-prod \
  --location australiaeast \
  --tags Environment=Production Application=Docufen
```

#### Step 2: Deploy Base Infrastructure
```bash
# Option A: Using Bash script
./deploy-docufen-production.sh \
  -g rg-docufen-prod \
  -l australiaeast \
  -t template-production.json \
  -p parameters-production-base.json

# Option B: Using PowerShell
.\Deploy-DocufenProduction.ps1 \
  -ResourceGroupName "rg-docufen-prod" \
  -Location "australiaeast" \
  -TemplateFile "template-production.json" \
  -ParametersFile "parameters-production-base.json"

# Option C: Direct Azure CLI
az deployment group create \
  --resource-group rg-docufen-prod \
  --template-file template-production.json \
  --parameters @parameters-production-base.json \
  --mode Complete
```

### Phase 2: Container App for Admin Interface (Optional)

#### Step 1: Deploy with Container App
```bash
# Using Bash script
./deploy-docufen-production.sh \
  -g rg-docufen-prod \
  -c \
  -t template-production-with-containerapp.json \
  -p parameters-production-containerapp.json

# Using PowerShell
.\Deploy-DocufenProduction.ps1 \
  -ResourceGroupName "rg-docufen-prod" \
  -IncludeContainerApp \
  -TemplateFile "template-production-with-containerapp.json" \
  -ParametersFile "parameters-production-containerapp.json"
```

#### Step 2: Configure Container App with GitHub Image
```bash
# Get latest image from GitHub Actions
IMAGE=$(./get-github-image.sh -w staging.yml | grep "export CONTAINER_IMAGE" | cut -d'"' -f2)

# Update Container App
az containerapp update \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod \
  --image "$IMAGE"
```

### Phase 3: Key Vault Configuration

#### Step 1: Create Key Vault Secrets
```bash
# Generate secrets template
./setup-keyvault-secrets.sh -k docufen-prod-kv -g rg-docufen-prod

# Edit the secrets file with actual values
nano keyvault-secrets.json

# Apply secrets
./setup-keyvault-secrets.sh -k docufen-prod-kv -g rg-docufen-prod -f keyvault-secrets.json
```

#### Step 2: Configure Container App Environment
```bash
# Update Container App with Key Vault references
./update-container-app-env.sh \
  -a docufen-admin-prod \
  -g rg-docufen-prod \
  -k docufen-prod-kv
```

### Phase 4: Post-Deployment Configuration

#### Step 1: Configure App Service
```bash
# Set application settings
az webapp config appsettings set \
  --name docufen-prod \
  --resource-group rg-docufen-prod \
  --settings \
    "AZURE_COSMOS_ENDPOINT=@Microsoft.KeyVault(VaultName=docufen-prod-kv;SecretName=cosmos-endpoint)" \
    "AZURE_STORAGE_CONNECTION_STRING=@Microsoft.KeyVault(VaultName=docufen-prod-kv;SecretName=storage-connection-string)"
```

#### Step 2: Configure Static Web App
```bash
# Get deployment token
az staticwebapp secrets list \
  --name docufenapp-prod \
  --query "properties.apiKey" \
  -o tsv

# Add to GitHub secrets for CI/CD
```

## Parameter Customization

### File: `parameters-production-base.json`
Customize these values before deployment:

| Parameter | Current Value | Notes |
|-----------|--------------|-------|
| `databaseAccounts_docufen_staging_name` | `docufen-prod-cosmos` | Must be globally unique |
| `registries_docufenstaging_name` | `docufenprod` | Must be globally unique, alphanumeric only |
| `storageAccounts_docufenstagingstorage_name` | `docufenprodstore` | 3-24 chars, lowercase |
| `vaults_docufen_staging_name` | `docufen-prod-kv` | 3-24 chars, alphanumeric and hyphens |

## Validation Commands

### Pre-Deployment Validation
```bash
# Validate template syntax
python3 fix-template-validation.py

# What-if deployment
az deployment group what-if \
  --resource-group rg-docufen-prod \
  --template-file template-production.json \
  --parameters @parameters-production-base.json
```

### Post-Deployment Validation
```bash
# List all resources
az resource list --resource-group rg-docufen-prod -o table

# Check deployment status
az deployment group list --resource-group rg-docufen-prod -o table

# Test endpoints
curl https://docufen-prod.azurewebsites.net/health
curl https://docufenapp-prod.azurestaticapps.net
```

## Troubleshooting

### Common Issues and Solutions

1. **Naming Conflicts**
   - Solution: Modify names in parameters file to be unique
   - Use timestamps: `docufen-prod-$(date +%m%d)`

2. **Static Web App Location**
   - Fixed: All templates now use `westeurope`
   - Available regions: westus2, centralus, eastus2, westeurope, eastasia

3. **Key Vault Access**
   - Ensure managed identity is enabled
   - Grant proper access policies after deployment

4. **Container Registry Authentication**
   - For ACR: Uses managed identity
   - For ghcr.io: Requires GitHub PAT in parameters

## Clean Deployment Script

Save this as `deploy-fresh.sh`:
```bash
#!/bin/bash
set -euo pipefail

RESOURCE_GROUP="rg-docufen-prod"
LOCATION="australiaeast"

echo "🚀 Starting fresh Docufen deployment..."

# 1. Clean up
echo "🧹 Cleaning up existing resources..."
if az group exists --name $RESOURCE_GROUP | grep -q "true"; then
    az group delete --name $RESOURCE_GROUP --yes
fi

# 2. Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 3. Deploy base infrastructure
echo "🏗️ Deploying base infrastructure..."
./deploy-docufen-production.sh \
  -g $RESOURCE_GROUP \
  -l $LOCATION \
  -t template-production.json \
  -p parameters-production-base.json

# 4. Setup Key Vault
echo "🔐 Setting up Key Vault..."
./setup-keyvault-secrets.sh -k docufen-prod-kv -g $RESOURCE_GROUP

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "  1. Edit keyvault-secrets.json with actual values"
echo "  2. Run: ./setup-keyvault-secrets.sh -k docufen-prod-kv -g $RESOURCE_GROUP -f keyvault-secrets.json"
echo "  3. Deploy Container App if needed"
```

## Success Criteria

- [ ] All resources deployed successfully
- [ ] No errors in deployment output
- [ ] Web App accessible via HTTPS
- [ ] Static Web App accessible
- [ ] Key Vault contains all required secrets
- [ ] Container App running (if deployed)
- [ ] Managed identities configured correctly

## Estimated Time

- Base infrastructure: 15-20 minutes
- Container App addition: 5-10 minutes
- Key Vault setup: 5 minutes
- Total: ~30 minutes

## Next Steps After Deployment

1. Configure custom domains
2. Set up SSL certificates
3. Configure backup policies
4. Enable monitoring and alerts
5. Deploy application code
6. Configure CI/CD pipelines