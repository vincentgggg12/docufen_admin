#!/bin/bash

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
if [ -z "$SUBSCRIPTION_ID" ]; then
    echo "Error: Unable to retrieve Azure subscription ID. Please ensure you are logged in."
    exit 1
fi
echo "Using Subscription ID: $SUBSCRIPTION_ID"
az account show --subscription $SUBSCRIPTION_ID
# Script to set up Virtual Network and Private Endpoints for Docufen

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-docufen-prod"
LOCATION="australiaeast"

# Function to log with colors
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     DOCUFEN NETWORKING SETUP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Get resource names
log_info "Getting resource names..."
VNET_NAME=$(az network vnet list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
COSMOS_NAME=$(az cosmosdb list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
KEYVAULT_NAME=$(az keyvault list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
APP_SERVICE_NAME=$(az webapp list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
CONTAINER_APP_NAME=$(az containerapp list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
CONTAINER_ENV_NAME=$(az containerapp env list -g $RESOURCE_GROUP --query "[0].name" -o tsv)

echo "VNet: $VNET_NAME"
echo "Cosmos DB: $COSMOS_NAME"
echo "Key Vault: $KEYVAULT_NAME"
echo "App Service: $APP_SERVICE_NAME"
echo "Container App: $CONTAINER_APP_NAME"
echo "Container Environment: $CONTAINER_ENV_NAME"
echo ""

# Step 1: Check VNet configuration
log_info "Checking VNet configuration..."
if [ -z "$VNET_NAME" ]; then
    log_error "No VNet found in resource group"
    exit 1
fi

# Get VNet details
VNET_ID=$(az network vnet show -g $RESOURCE_GROUP -n $VNET_NAME --query id -o tsv)
log_success "VNet found: $VNET_NAME"

# List subnets
log_info "Checking subnets..."
az network vnet subnet list -g $RESOURCE_GROUP --vnet-name $VNET_NAME --query "[].{name:name, addressPrefix:addressPrefix, privateEndpointNetworkPolicies:privateEndpointNetworkPolicies}" -o table

# Check/Create containers subnet for Container Apps
CONTAINERS_SUBNET=$(az network vnet subnet show -g $RESOURCE_GROUP --vnet-name $VNET_NAME -n containers --query id -o tsv 2>/dev/null)
if [ -z "$CONTAINERS_SUBNET" ]; then
    log_warn "Creating 'containers' subnet for Container Apps..."
    az network vnet subnet create \
        -g $RESOURCE_GROUP \
        --vnet-name $VNET_NAME \
        -n containers \
        --address-prefix "10.0.4.0/23" \
        --delegations Microsoft.App/environments
    CONTAINERS_SUBNET=$(az network vnet subnet show -g $RESOURCE_GROUP --vnet-name $VNET_NAME -n containers --query id -o tsv)
fi

# Step 2: Check/Create Private DNS Zones
log_info ""
log_info "Checking Private DNS Zones..."

# Check for Cosmos DB private DNS zone
COSMOS_DNS_ZONE="privatelink.documents.azure.com"
if ! az network private-dns zone show -g $RESOURCE_GROUP -n $COSMOS_DNS_ZONE &>/dev/null; then
    log_warn "Creating Private DNS Zone for Cosmos DB..."
    az network private-dns zone create -g $RESOURCE_GROUP -n $COSMOS_DNS_ZONE
else
    log_success "Cosmos DB Private DNS Zone exists"
fi

# Check for Key Vault private DNS zone
KV_DNS_ZONE="privatelink.vaultcore.azure.net"
if ! az network private-dns zone show -g $RESOURCE_GROUP -n $KV_DNS_ZONE &>/dev/null; then
    log_warn "Creating Private DNS Zone for Key Vault..."
    az network private-dns zone create -g $RESOURCE_GROUP -n $KV_DNS_ZONE
else
    log_success "Key Vault Private DNS Zone exists"
fi

# Step 3: Link DNS Zones to VNet
log_info ""
log_info "Checking DNS Zone VNet links..."

# Link Cosmos DNS to VNet
if ! az network private-dns link vnet show -g $RESOURCE_GROUP -z $COSMOS_DNS_ZONE -n "${VNET_NAME}-link" &>/dev/null; then
    log_warn "Linking Cosmos DNS Zone to VNet..."
    az network private-dns link vnet create -g $RESOURCE_GROUP -z $COSMOS_DNS_ZONE -n "${VNET_NAME}-link" -v $VNET_ID -e false
else
    log_success "Cosmos DNS Zone already linked to VNet"
fi

# Link KeyVault DNS to VNet
if ! az network private-dns link vnet show -g $RESOURCE_GROUP -z $KV_DNS_ZONE -n "${VNET_NAME}-link" &>/dev/null; then
    log_warn "Linking Key Vault DNS Zone to VNet..."
    az network private-dns link vnet create -g $RESOURCE_GROUP -z $KV_DNS_ZONE -n "${VNET_NAME}-link" -v $VNET_ID -e false
else
    log_success "Key Vault DNS Zone already linked to VNet"
fi

# Step 4: Check/Create Private Endpoints
log_info ""
log_info "Checking Private Endpoints..."

# Get subnet for private endpoints
PE_SUBNET=$(az network vnet subnet show -g $RESOURCE_GROUP --vnet-name $VNET_NAME -n privatelinks --query id -o tsv 2>/dev/null)
if [ -z "$PE_SUBNET" ]; then
    PE_SUBNET=$(az network vnet subnet show -g $RESOURCE_GROUP --vnet-name $VNET_NAME -n databases --query id -o tsv)
    log_warn "Using 'databases' subnet for private endpoints"
fi

# Check Cosmos DB private endpoint
COSMOS_PE=$(az network private-endpoint list -g $RESOURCE_GROUP --query "[?privateLinkServiceConnections[0].privateLinkServiceId == '/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/$COSMOS_NAME'].name" -o tsv)

if [ -z "$COSMOS_PE" ]; then
    log_warn "Creating Private Endpoint for Cosmos DB..."
    COSMOS_ID=$(az cosmosdb show -g $RESOURCE_GROUP -n $COSMOS_NAME --query id -o tsv)
    
    az network private-endpoint create \
        --name "${COSMOS_NAME}-ep" \
        --resource-group $RESOURCE_GROUP \
        --vnet-name $VNET_NAME \
        --subnet $PE_SUBNET \
        --private-connection-resource-id $COSMOS_ID \
        --group-id Sql \
        --connection-name "${COSMOS_NAME}-connection"
    
    # Create DNS zone group
    az network private-endpoint dns-zone-group create \
        --endpoint-name "${COSMOS_NAME}-ep" \
        --resource-group $RESOURCE_GROUP \
        --name default \
        --private-dns-zone $COSMOS_DNS_ZONE \
        --zone-name cosmos
else
    log_success "Cosmos DB Private Endpoint exists: $COSMOS_PE"
fi

# Check Key Vault private endpoint
KV_PE=$(az network private-endpoint list -g $RESOURCE_GROUP --query "[?privateLinkServiceConnections[0].privateLinkServiceId == '/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEYVAULT_NAME'].name" -o tsv)

if [ -z "$KV_PE" ]; then
    log_warn "Creating Private Endpoint for Key Vault..."
    KV_ID=$(az keyvault show -g $RESOURCE_GROUP -n $KEYVAULT_NAME --query id -o tsv)
    
    az network private-endpoint create \
        --name "${KEYVAULT_NAME}-ep" \
        --resource-group $RESOURCE_GROUP \
        --vnet-name $VNET_NAME \
        --subnet $PE_SUBNET \
        --private-connection-resource-id $KV_ID \
        --group-id vault \
        --connection-name "${KEYVAULT_NAME}-connection"
    
    # Create DNS zone group
    az network private-endpoint dns-zone-group create \
        --endpoint-name "${KEYVAULT_NAME}-ep" \
        --resource-group $RESOURCE_GROUP \
        --name default \
        --private-dns-zone $KV_DNS_ZONE \
        --zone-name keyvault
else
    log_success "Key Vault Private Endpoint exists: $KV_PE"
fi

# Step 5: Configure Container App Environment
if [ ! -z "$CONTAINER_ENV_NAME" ]; then
    log_info ""
    log_info "Configuring Container App Environment..."
    
    # Check if Container Environment is already using the VNet
    ENV_SUBNET=$(az containerapp env show -g $RESOURCE_GROUP -n $CONTAINER_ENV_NAME --query "properties.vnetConfiguration.infrastructureSubnetId" -o tsv)
    
    if [ -z "$ENV_SUBNET" ] || [ "$ENV_SUBNET" == "null" ]; then
        log_warn "Container Environment not connected to VNet. This requires recreating the environment."
        echo -e "${YELLOW}Note: Container App Environments cannot be updated to use VNet after creation.${NC}"
        echo -e "${YELLOW}You would need to recreate the environment with VNet configuration.${NC}"
    else
        log_success "Container Environment already connected to VNet"
    fi
    
    # Configure Container App
    if [ ! -z "$CONTAINER_APP_NAME" ]; then
        log_info "Configuring Container App..."
        
        # Get Container App managed identity
        CA_IDENTITY=$(az containerapp identity show -g $RESOURCE_GROUP -n $CONTAINER_APP_NAME --query principalId -o tsv 2>/dev/null)
        
        if [ -z "$CA_IDENTITY" ]; then
            log_warn "Assigning managed identity to Container App..."
            CA_IDENTITY=$(az containerapp identity assign -g $RESOURCE_GROUP -n $CONTAINER_APP_NAME --system-assigned --query principalId -o tsv)
        fi
        
        log_info "Container App Identity: $CA_IDENTITY"
        
        # Grant Key Vault access to Container App
        log_info "Granting Container App access to Key Vault..."
        az role assignment create \
            --role "Key Vault Secrets User" \
            --assignee-object-id $CA_IDENTITY \
            --assignee-principal-type ServicePrincipal \
            --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEYVAULT_NAME" \
            2>/dev/null || echo -e "${YELLOW}Role may already be assigned${NC}"
        
        # Update Container App with Key Vault references
        log_info "Updating Container App environment variables..."
        
        # Get Cosmos endpoint
        COSMOS_ENDPOINT=$(az cosmosdb show -g $RESOURCE_GROUP -n $COSMOS_NAME --query documentEndpoint -o tsv)
        
        # Update Container App secrets and env vars
        az containerapp update -g $RESOURCE_GROUP -n $CONTAINER_APP_NAME \
            --set-env-vars \
                COSMOS_ENDPOINT=$COSMOS_ENDPOINT \
                KEYVAULT_NAME=$KEYVAULT_NAME \
                AZURE_CLIENT_ID=$CA_IDENTITY \
            --replace-env-vars true
        
        log_success "Container App configuration updated"
    fi
fi

# Step 6: Check App Service VNet Integration
log_info ""
log_info "Checking App Service VNet Integration..."

# Check if App Service is integrated with VNet
VNET_INTEGRATION=$(az webapp vnet-integration list -g $RESOURCE_GROUP -n $APP_SERVICE_NAME --query "[0].name" -o tsv)

if [ -z "$VNET_INTEGRATION" ]; then
    log_warn "Integrating App Service with VNet..."
    # Get the default subnet
    DEFAULT_SUBNET=$(az network vnet subnet show -g $RESOURCE_GROUP --vnet-name $VNET_NAME -n default --query id -o tsv)
    
    az webapp vnet-integration add \
        -g $RESOURCE_GROUP \
        -n $APP_SERVICE_NAME \
        --vnet $VNET_ID \
        --subnet $DEFAULT_SUBNET
else
    log_success "App Service already integrated with VNet"
fi

# Step 7: Update App Service configuration
log_info ""
log_info "Updating App Service configuration..."

# Set WEBSITE_VNET_ROUTE_ALL to ensure all traffic goes through VNet
az webapp config appsettings set -g $RESOURCE_GROUP -n $APP_SERVICE_NAME \
    --settings WEBSITE_VNET_ROUTE_ALL=1 WEBSITE_DNS_SERVER=168.63.129.16 \
    --output none

log_success "App Service VNet routing configured"

# Step 8: Verify connectivity
log_info ""
log_info "Verifying Private Endpoint connectivity..."

# Get private endpoint IPs
log_info "Private Endpoint IPs:"
COSMOS_IP=$(az network private-endpoint show -g $RESOURCE_GROUP -n "${COSMOS_NAME}-ep" --query "customDnsConfigs[0].ipAddresses[0]" -o tsv 2>/dev/null || echo "Not found")
KV_IP=$(az network private-endpoint show -g $RESOURCE_GROUP -n "${KEYVAULT_NAME}-ep" --query "customDnsConfigs[0].ipAddresses[0]" -o tsv 2>/dev/null || echo "Not found")

echo "Cosmos DB Private IP: $COSMOS_IP"
echo "Key Vault Private IP: $KV_IP"

# Step 9: Restart services
log_info ""
read -p "Do you want to restart the App Service and Container App to apply changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -z "$APP_SERVICE_NAME" ]; then
        log_info "Restarting App Service..."
        az webapp restart -g $RESOURCE_GROUP -n $APP_SERVICE_NAME
        log_success "App Service restarted"
    fi
    
    if [ ! -z "$CONTAINER_APP_NAME" ]; then
        log_info "Restarting Container App..."
        az containerapp revision restart -g $RESOURCE_GROUP -n $CONTAINER_APP_NAME
        log_success "Container App restarted"
    fi
fi

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     NETWORKING SETUP COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "Summary:"
echo "- VNet: $VNET_NAME"
echo "- Private DNS Zones configured"
echo "- Private Endpoints created/verified"
echo "- App Service VNet integration configured"
if [ ! -z "$CONTAINER_APP_NAME" ]; then
    echo "- Container App configured with managed identity"
    echo "- Container App granted Key Vault access"
fi
echo ""
echo "Services should now be able to access:"
echo "- Cosmos DB through private endpoint"
echo "- Key Vault through private endpoint"
echo ""
echo "If services still fail to start, check:"
echo "1. Key Vault RBAC permissions for managed identities"
echo "2. Cosmos DB network restrictions"
echo "3. Service logs for specific errors"
echo ""
if [ ! -z "$CONTAINER_ENV_NAME" ] && [ -z "$ENV_SUBNET" ]; then
    echo -e "${YELLOW}Note: Container App Environment needs to be recreated with VNet support${NC}"
    echo "To do this, you would need to:"
    echo "1. Delete the current Container App and Environment"
    echo "2. Recreate with --infrastructure-subnet-resource-id parameter"
fi