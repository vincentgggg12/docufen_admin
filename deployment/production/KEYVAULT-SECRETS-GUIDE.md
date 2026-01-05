# Key Vault Secrets Management Guide

This guide helps you set up and manage Key Vault secrets for your Docufen Container App deployment.

## Overview

The Container App uses Azure Key Vault to securely store and access sensitive configuration values. This approach provides:
- Centralized secret management
- Secure access using managed identities
- Easy secret rotation without redeployment
- Audit trail for secret access

## Initial Setup

### 1. Create Key Vault Secrets

Use the provided script to set up all secrets:

```bash
# Create template file with placeholders
./setup-keyvault-secrets.sh -k docufen-prod-kv -g rg-docufen-prod

# Edit the generated keyvault-secrets.json file
nano keyvault-secrets.json

# Apply the secrets
./setup-keyvault-secrets.sh -k docufen-prod-kv -g rg-docufen-prod -f keyvault-secrets.json
```

Or with PowerShell:
```powershell
.\Setup-KeyVaultSecrets.ps1 -KeyVaultName "docufen-prod-kv" -ResourceGroupName "rg-docufen-prod"
```

### 2. Update Container App Environment

After secrets are in Key Vault, update the Container App:

```bash
./update-container-app-env.sh \
  -a docufen-admin-prod \
  -g rg-docufen-prod \
  -k docufen-prod-kv
```

## Required Secrets

### Core Azure Services

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `cosmos-endpoint` | Cosmos DB endpoint URL | Azure Portal → Cosmos DB → Keys |
| `cosmos-key` | Cosmos DB primary key | Azure Portal → Cosmos DB → Keys |
| `storage-connection-string` | Storage account connection | Azure Portal → Storage → Access keys |
| `queue-connection-string` | Queue storage connection | Same as storage connection string |

### Authentication

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `azure-ad-client-id` | Azure AD app client ID | Azure Portal → App registrations |
| `azure-ad-client-secret` | Azure AD app secret | Azure Portal → App registrations → Certificates & secrets |
| `azure-ad-tenant-id` | Azure AD tenant ID | Azure Portal → Azure Active Directory → Properties |
| `session-secret` | Express session secret | Generate random string (32+ chars) |
| `jwt-secret` | JWT signing secret | Generate random string (32+ chars) |

### External Services

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `amplitude-api-key` | Amplitude analytics API key | Amplitude dashboard |
| `sendgrid-api-key` | SendGrid email API key | SendGrid dashboard |
| `appinsights-instrumentation-key` | Application Insights key | Azure Portal → Application Insights |

### Email Configuration

| Secret Name | Description | Example |
|------------|-------------|---------|
| `smtp-host` | SMTP server hostname | smtp.sendgrid.net |
| `smtp-port` | SMTP server port | 587 |
| `smtp-username` | SMTP username | apikey |
| `smtp-password` | SMTP password | Your SendGrid API key |
| `from-email` | Default from email | noreply@docufen.com |

## Generating Secret Values

### Random Secrets
```bash
# Generate session secret
openssl rand -hex 32

# Generate JWT secret
openssl rand -base64 32

# Generate API key
uuidgen | tr -d '-'
```

### Azure Resource Connection Strings
```bash
# Get Cosmos DB connection
az cosmosdb keys list \
  --name docufen-prod-cosmos \
  --resource-group rg-docufen-prod \
  --query primaryMasterKey -o tsv

# Get Storage connection string
az storage account show-connection-string \
  --name docufenprodstor \
  --resource-group rg-docufen-prod \
  --query connectionString -o tsv
```

## Environment Variable Mapping

The Container App uses these patterns for environment variables:

1. **Direct values**: Non-sensitive configuration
   ```
   NODE_ENV=production
   PORT=3000
   ```

2. **Secret references**: Sensitive values from Key Vault
   ```
   AZURE_COSMOS_KEY=secretref:cosmos-key
   SESSION_SECRET=secretref:session-secret
   ```

3. **Key Vault references**: Direct Key Vault integration
   ```
   keyvaultref:https://docufen-prod-kv.vault.azure.net/secrets/cosmos-key
   ```

## Secret Rotation

To rotate a secret:

1. Update the secret in Key Vault:
```bash
az keyvault secret set \
  --vault-name docufen-prod-kv \
  --name session-secret \
  --value "new-secret-value"
```

2. Restart the Container App to pick up the new value:
```bash
az containerapp revision restart \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod
```

## Troubleshooting

### Verify Secret Access
```bash
# Check Container App has Key Vault access
az keyvault show \
  --name docufen-prod-kv \
  --query "properties.accessPolicies[?permissions.secrets[0]=='get'].objectId" \
  -o tsv

# List Container App secrets
az containerapp secret list \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod \
  -o table
```

### Common Issues

1. **"Secret not found" errors**
   - Verify secret exists in Key Vault
   - Check secret name matches (case-sensitive)
   - Ensure Container App has Key Vault access

2. **"Access denied" errors**
   - Verify managed identity is enabled
   - Check Key Vault access policies
   - Ensure network access is allowed

3. **Environment variables not updating**
   - Container App revision must be restarted
   - Check for typos in secret references
   - Verify Key Vault URI is correct

## Security Best Practices

1. **Use managed identities** - Never store Key Vault credentials
2. **Principle of least privilege** - Grant only required permissions
3. **Enable soft delete** - Protect against accidental deletion
4. **Regular rotation** - Update secrets periodically
5. **Audit access** - Monitor Key Vault logs
6. **Network restrictions** - Use private endpoints when possible

## Migration from App Service

If migrating from App Service configuration:

1. Export existing settings:
```bash
az webapp config appsettings list \
  --name docufen-staging \
  --resource-group rg-docufen \
  -o json > appsettings.json
```

2. Transform to Key Vault secrets:
```bash
# Use jq to transform format
jq -r '.[] | "\(.name)=\(.value)"' appsettings.json > secrets.txt
```

3. Import to Key Vault using the setup script

## Complete Example

```bash
# 1. Set up Key Vault with secrets
./setup-keyvault-secrets.sh -k docufen-prod-kv -g rg-docufen-prod

# 2. Edit secrets file with actual values
vim keyvault-secrets.json

# 3. Apply secrets
./setup-keyvault-secrets.sh -k docufen-prod-kv -g rg-docufen-prod

# 4. Deploy Container App with Key Vault integration
./deploy-docufen-production.sh -g rg-docufen-prod -c

# 5. Configure Container App environment
./update-container-app-env.sh \
  -a docufen-admin-prod \
  -g rg-docufen-prod \
  -k docufen-prod-kv

# 6. Verify deployment
az containerapp show \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod \
  --query properties.configuration.secrets \
  -o table
```