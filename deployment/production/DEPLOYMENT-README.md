# Docufen Production Deployment

This directory contains scripts and templates for deploying Docufen to a new production environment in Azure.

## Prerequisites

1. Azure CLI installed and logged in (`az login`)
2. Python 3 installed
3. Appropriate Azure subscription permissions
4. The ARM template exported from your resource group (`template.json`)

## Files

- `deploy-production.sh` - Main deployment script (run this!)
- `parameters-production-containerapp.json` - This was built from the template exported from stage and then some things were changed
   - Mongo removed
   - Container app added and vnet enabled for container app
- Various Python helper scripts (created automatically by deploy-production.sh)

## Usage

### Deployment with Container App
```bash
./deploy-production.sh containerapp
```

## What the Script Does

1. **Cleans the template** - Removes MongoDB resources and problematic deployments
2. **Fixes issues** - Corrects SQL role assignments, Key Vault secrets, and locations
3. **Adds Container App** (optional) - Includes admin interface deployment
4. **Creates unique parameters** - Uses timestamps to avoid naming conflicts
5. **Manages resource group** - Optionally deletes existing and creates new
6. **Deploys resources** - Runs the ARM template deployment
7. **Monitors progress** - Shows deployment status in real-time
8. **Saves deployment info** - Creates a record of what was deployed

## Features

- **Repeatable**: Each run uses unique timestamps to avoid conflicts
- **Safe**: Asks before deleting existing resource groups
- **Complete**: Handles all known deployment issues automatically
- **Monitored**: Shows real-time deployment progress
- **Documented**: Saves deployment information for reference

## Post-Deployment Steps

1. **Update Key Vault Secrets**
   This is done in run_assignRoles.sh
   ```bash 
   # Get the Key Vault name from deployment info
   az keyvault secret set --vault-name <your-kv-name> --name COSMOSKEY --value <actual-value>
   az keyvault secret set --vault-name <your-kv-name> --name COOKIESECRET --value <actual-value>
   # etc...
   ```

2. **Update App name in github action** or maybe deploy manually (if using Container App)
   ```bash
   az containerapp update -g rg-docufen-prod -n <container-app-name> \
     --image ghcr.io/integritycodes/docufen_server:latest
   ```

3. **Configure Custom Domains**
   - Add custom domains to App Service and Static Web App
   - Update DNS records

4. **Set Access Policies**
   - Configure Key Vault access policies for managed identities
   - Set up network restrictions as needed

## Troubleshooting

### Deployment Fails
- Check the error details shown by the script
- Review the deployment operations in Azure Portal
- Common issues:
  - Resource names already exist (script uses timestamps to avoid this)
  - Region availability (Static Web Apps only in certain regions)
  - Quota limits

### Resource Group Already Exists
- The script will ask if you want to delete it
- Choose 'N' to deploy into existing group
- Choose 'Y' to start fresh

### Can't Find Deployment Info
- Look for `deployment-info-{timestamp}.txt` files
- These contain all the resource names created

## Customization

To use your own container image instead of the hello-world sample:

1. Edit the parameters file after it's created (before deployment completes)
2. Or update the Container App after deployment:
   ```bash
   az containerapp update -g rg-docufen-prod -n docufen-admin-{timestamp} \
     --image ghcr.io/integritycodes/docufen_server:your-tag
   ```

## Clean Up

To remove everything:
```bash
az group delete -n rg-docufen-prod -y
```

## Support

This script handles the known issues with the Docufen deployment:
- MongoDB resource removal
- SQL role assignment GUID conflicts  
- Key Vault secrets without values
- Static Web App region restrictions
- Web deployment resources expecting repositories

If you encounter new issues, the script outputs detailed error information to help with troubleshooting.