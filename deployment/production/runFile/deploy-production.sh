#!/bin/bash

# DOCUFEN PRODUCTION DEPLOYMENT SCRIPT
# This script can be run repeatedly to deploy a new production environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-docufen-prod"
LOCATION="westeurope"
TIMESTAMP=$(date +%m%d%H%M)

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        DOCUFEN PRODUCTION DEPLOYMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[$(date +%H:%M:%S)] INFO:${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +%H:%M:%S)] ERROR:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)] SUCCESS:${NC} $1"
}

# Check prerequisites
log "Checking prerequisites..."

if ! command -v az &> /dev/null; then
    log_error "Azure CLI not found. Please install Azure CLI."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    log_error "Python 3 not found. Please install Python 3."
    exit 1
fi

# Check Azure login
log "Checking Azure authentication..."
ACCOUNT=$(az account show --query user.name -o tsv 2>/dev/null || echo "")
if [ -z "$ACCOUNT" ]; then
    log_error "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi
log_info "Azure Account: $ACCOUNT"

# Get subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
log_info "Subscription: $SUBSCRIPTION"

# Step 1: Check for existing clean templates
log ""
log "Step 1: Checking for templates..."

TEMPLATE_FILE="template-production.json"

log_success "Template selected: $TEMPLATE_FILE"

# Step 2: Create parameters file
log ""
log "Step 2: Creating parameters file..."

# PARAMS_FILE="parameters-prod-${TIMESTAMP}.json"

# cat > $PARAMS_FILE << EOF
# {
#   "\$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
#   "contentVersion": "1.0.0.0",
#   "parameters": {
#     "databaseAccounts_docufen_staging_name": {
#       "value": "docufen-prod-cosmos-${TIMESTAMP}"
#     },
#     "privateDnsZones_privatelink_documents_azure_com_name": {
#       "value": "privatelink.documents.azure.com"
#     },
#     "privateDnsZones_privatelink_vaultcore_azure_net_name": {
#       "value": "privatelink.vaultcore.azure.net"
#     },
#     "privateEndpoints_cosmosstagingendpoint_name": {
#       "value": "cosmos-endpoint-${TIMESTAMP}"
#     },
#     "privateEndpoints_keyvaultstagingendpoint_name": {
#       "value": "keyvault-endpoint-${TIMESTAMP}"
#     },
#     "registries_docufenstaging_name": {
#       "value": "docufenprod${TIMESTAMP}"
#     },
#     "serverfarms_docufenAppServicePlanstaging_name": {
#       "value": "docufen-plan-${TIMESTAMP}"
#     },
#     "sites_docufen_staging_name": {
#       "value": "docufen-app-${TIMESTAMP}"
#     },
#     "staticSites_docufenapp_staging_name": {
#       "value": "docufenapp-${TIMESTAMP}"
#     },
#     "storageAccounts_docufenstagingstorage_name": {
#       "value": "docufenstor${TIMESTAMP}"
#     },
#     "systemTopics_docufenstagingstorage_f33197b9_a5d1_4f96_a661_7b8ffa72c06c_name": {
#       "value": "docufen-topic-${TIMESTAMP}"
#     },
#     "vaults_docufen_staging_name": {
#       "value": "docufen-kv-${TIMESTAMP}"
#     },
#     "virtualNetworks_vnet_staging_name": {
#       "value": "vnet-docufen-${TIMESTAMP}"
#     }
# EOF
PARAMS_FILE="parameters-prod-06231344.json"
log_info "Parameters file created: $PARAMS_FILE"

# Step 3: Resource Group Management
log ""
log "Step 3: Managing resource group..."

if az group show -n $RESOURCE_GROUP &>/dev/null; then
    log_warn "Resource group '$RESOURCE_GROUP' already exists!"
    read -p "Do you want to delete it and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Deleting resource group..."
        az group delete -n $RESOURCE_GROUP -y --no-wait
        log "Waiting for deletion to complete..."
        while az group show -n $RESOURCE_GROUP &>/dev/null; do
            echo -n "."
            sleep 5
        done
        echo
        log_success "Resource group deleted"
    else
        log_info "Proceeding with existing resource group"
    fi
fi

# Create resource group if it doesn't exist
if ! az group show -n $RESOURCE_GROUP &>/dev/null; then
    log "Creating resource group..."
    az group create -n $RESOURCE_GROUP -l $LOCATION
    log_success "Resource group created"
fi

# Step 4: Deploy
log ""
log "Step 4: Starting deployment..."
log_info "Deployment name: docufen-deploy-${TIMESTAMP}"
log_info "Template: $TEMPLATE_FILE"
log_info "Parameters: $PARAMS_FILE"

# Run deployment
az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file $TEMPLATE_FILE \
    --parameters $PARAMS_FILE \
    --name docufen-deploy-${TIMESTAMP} \
    --mode Incremental \
    --no-wait

# Monitor deployment
log ""
log "Monitoring deployment progress..."
sleep 5

while true; do
    STATUS=$(az deployment group show -g $RESOURCE_GROUP -n docufen-deploy-${TIMESTAMP} --query properties.provisioningState -o tsv 2>/dev/null || echo "Unknown")
    
    case $STATUS in
        "Succeeded")
            log_success "Deployment completed successfully!"
            break
            ;;
        "Failed")
            log_error "Deployment failed!"
            log "Getting error details..."
            az deployment operation group list -g $RESOURCE_GROUP -n docufen-deploy-${TIMESTAMP} --query "[?properties.provisioningState=='Failed'].{resource:properties.targetResource.resourceType, error:properties.statusMessage.error.message}" -o table
            exit 1
            ;;
        "Running"|"Accepted")
            echo -n "."
            sleep 10
            ;;
        *)
            log_warn "Unknown status: $STATUS"
            sleep 10
            ;;
    esac
done

# Step 5: Post-deployment
log ""
log "Step 5: Post-deployment tasks..."

# Get Key Vault name
KV_NAME=$(az keyvault list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
if [ ! -z "$KV_NAME" ]; then
    log_info "Key Vault created: $KV_NAME"
    log_info "Remember to set the actual secret values in Key Vault"
fi

# Get Container App URL if deployed
if [ "$TEMPLATE_FILE" == "template-containerapp.json" ]; then
    APP_URL=$(az containerapp show -g $RESOURCE_GROUP -n docufen-admin-${TIMESTAMP} --query properties.configuration.ingress.fqdn -o tsv 2>/dev/null || echo "")
    if [ ! -z "$APP_URL" ]; then
        log_info "Container App URL: https://$APP_URL"
    fi
fi

log ""
log_success "Deployment complete!"
log ""
log "Next steps:"
log "1. Update Key Vault secrets with actual values"
log "2. Configure custom domains if needed"
log "3. Update container image for Container App"
log "4. Configure access policies and networking"

# Save deployment info
cat > deployment-info-${TIMESTAMP}.txt << EOF
Deployment Information
=====================
Timestamp: ${TIMESTAMP}
Resource Group: ${RESOURCE_GROUP}
Template: ${TEMPLATE_FILE}
Parameters: ${PARAMS_FILE}

Resources Created:
- Cosmos DB: docufen-prod-cosmos-${TIMESTAMP}
- Key Vault: docufen-kv-${TIMESTAMP}
- Storage: docufenstor${TIMESTAMP}
- App Service: docufen-app-${TIMESTAMP}
- Static Site: docufenapp-${TIMESTAMP}
- VNet: vnet-docufen-${TIMESTAMP}
EOF

if [ "$TEMPLATE_FILE" == "template-containerapp.json" ]; then
    cat >> deployment-info-${TIMESTAMP}.txt << EOF
- Container App: docufen-admin-${TIMESTAMP}
- Log Analytics: docufen-logs-${TIMESTAMP}
- Container Environment: docufen-env-${TIMESTAMP}
EOF
fi

log_info "Deployment info saved to: deployment-info-${TIMESTAMP}.txt"