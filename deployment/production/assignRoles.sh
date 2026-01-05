resourceGroupName="rg-docufen-prod"
subscription="71bd4c79-d12b-4702-985e-474e9f3a6380"
APP_SERVICE_NAME=$(az webapp list -g $resourceGroupName --query "[0].name" -o tsv)
CONTAINER_NAME=$(az containerapp list -g $resourceGroupName --query "[0].name" -o tsv)
COSMOS_NAME=$(az cosmosdb list -g $resourceGroupName --query "[0].name" -o tsv)
KEYVAULT_NAME=$(az keyvault list -g $resourceGroupName --query "[0].name" -o tsv)
STORAGE_NAME=$(az storage account list -g $resourceGroupName --query "[0].name" -o tsv)

principalId=$(az webapp show -g rg-docufen-prod -n $APP_SERVICE_NAME --query identity.principalId -o tsv)
conPrincipalId=$(az containerapp show -g $resourceGroupName -n $CONTAINER_NAME --query identity.principalId -o tsv) 
if [ -z "$principalId" ]; then
    echo "Error: Unable to retrieve principalId for the web app."
    exit 1
fi
az role assignment create \
     --role "Key Vault Secrets User" \
     --assignee $principalId \
     --scope /subscriptions/${subscription}/resourcegroups/${resourceGroupName}/providers/Microsoft.KeyVault/vaults/${KEYVAULT_NAME}

az cosmosdb sql role assignment create \
    --account-name ${COSMOS_NAME} \
    --resource-group  $resourceGroupName \
    --scope "/" \
    --principal-id $principalId \
    --role-definition-id "00000000-0000-0000-0000-000000000002"

az role assignment create \
     --role "Storage Blob Data Contributor" \
     --assignee $principalId \
     --scope /subscriptions/${subscription}/resourcegroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts/${STORAGE_NAME}

az role assignment create \
     --role "Storage Blob Data Contributor" \
     --assignee $conPrincipalId \
     --scope /subscriptions/${subscription}/resourcegroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts/${STORAGE_NAME}

az role assignment create \
     --role "Key Vault Secrets User" \
     --assignee $conPrincipalId \
     --scope /subscriptions/${subscription}/resourcegroups/${resourceGroupName}/providers/Microsoft.KeyVault/vaults/${KEYVAULT_NAME}

az cosmosdb sql role assignment create \
    --account-name ${COSMOS_NAME} \
    --resource-group  $resourceGroupName \
    --scope "/" \
    --principal-id $conPrincipalId \
    --role-definition-id "00000000-0000-0000-0000-000000000002"


# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting App Service environment variables...${NC}"

# Method 1: All at once with line continuation
az webapp config appsettings set \
  -g $resourceGroupName \
  -n $APP_SERVICE_NAME \
  --settings \
    DOCKER_REGISTRY_SERVER_PASSWORD="" \
    AZURE_COMMUNICATION_CONNECTION_STRING="", \
    DOCKER_REGISTRY_SERVER_URL="https://ghcr.io" \
    DOCKER_REGISTRY_SERVER_USERNAME="docu-bill" \
    DOCUFEN_ADMIN_TOKEN="" \
    NODE_ENV="production" \
    JIRA_CLOUD_ID="" \
    JIRA_API_TOKEN="" \
    JIRA_ISSUE_TYPE_ID="10089" \
    JIRA_PROJECT_KEY="DS" \
    JIRA_SERVICE_EMAIL="support@docufen.com" \
    HOST_CO="prod" \
    KEY_VAULT_NAME="$KEYVAULT_NAME" \
    STRIPE_API_KEY="" \
    WEBSITE_HEALTHCHECK_MAXPINGFAILURES="3" \
    WEBSITE_HTTPLOGGING_RETENTION_DAYS="30" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="false" \
    WEBSITES_PORT="3000" \
    COSMOS_ENDPOINT="https://${COSMOS_NAME}.documents.azure.com:443/" \

echo -e "${GREEN}Environment variables set successfully!${NC}"

az keyvault secret set --vault-name $KEYVAULT_NAME --name COOKIESECRET --value Cookie secret
az keyvault secret set --vault-name $KEYVAULT_NAME --name ADDINSECRET --value ADDin secret
az keyvault secret set --vault-name $KEYVAULT_NAME --name CERTIFICATE --value certificate_to_sign_pdf
az keyvault secret set --vault-name $KEYVAULT_NAME --name COSMOSKEY --value cosmoskey...
