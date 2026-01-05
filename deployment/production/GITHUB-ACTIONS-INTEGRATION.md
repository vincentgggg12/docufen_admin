# GitHub Actions Container Image Integration Guide

This guide explains how to reuse container images built by GitHub Actions in your Container App deployment.

## Overview

Your GitHub Actions workflows (like `beta.yaml`, `staging.yml`) build and push Docker images to GitHub Container Registry (ghcr.io). These images can be directly used in your Container App deployment without rebuilding.

## Image Naming Convention

GitHub Actions workflows push images with this format:
```
ghcr.io/<org>/<repo>:<commit-sha>
```

For example:
```
ghcr.io/integritycodes/docufen_server:a1b2c3d4e5f6
```

## Finding the Latest Image

### Method 1: Using the Helper Script

```bash
# Get the latest image from staging workflow
./get-github-image.sh -w staging.yml

# Get image from a specific branch
./get-github-image.sh -b feature/admin-ui -w beta.yml

# Use with GitHub token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
./get-github-image.sh
```

### Method 2: GitHub CLI

```bash
# List recent workflow runs
gh run list --workflow=staging.yml --branch=main --limit=5

# Get details of a specific run
gh run view <run-id>

# Find the commit SHA
gh run view <run-id> --json headSha -q .headSha
```

### Method 3: GitHub API

```bash
# Get latest successful run
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/IntegrityCodes/docufen_server/actions/workflows/staging.yml/runs?branch=main&status=success&per_page=1" \
  | jq -r '.workflow_runs[0].head_sha'
```

## Deployment Options

### Option 1: Direct Deployment with Image

```bash
# Get the image name
IMAGE=$(./get-github-image.sh -w beta.yml | grep "export CONTAINER_IMAGE" | cut -d'"' -f2)

# Deploy with Bash
./deploy-docufen-production.sh \
  -g rg-docufen-prod \
  -c \
  -i "$IMAGE"

# Deploy with PowerShell  
.\Deploy-DocufenProduction.ps1 \
  -ResourceGroupName "rg-docufen-prod" \
  -IncludeContainerApp \
  -ContainerImage "$IMAGE"
```

### Option 2: Using Parameters File

Update `parameters-production-containerapp.json`:
```json
{
  "parameters": {
    "containerImage": {
      "value": "ghcr.io/integritycodes/docufen_server:a1b2c3d4e5f6"
    },
    "githubUsername": {
      "value": "your-github-username"
    }
  }
}
```

Then deploy:
```bash
./deploy-docufen-production.sh -g rg-docufen-prod -c
```

### Option 3: Azure CLI Direct Update

For existing Container Apps:
```bash
# Update to latest image
az containerapp update \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod \
  --image "ghcr.io/integritycodes/docufen_server:$COMMIT_SHA"
```

## Authentication Setup

### GitHub Personal Access Token (PAT)

1. Create a PAT with `read:packages` scope:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a classic token with `read:packages` permission

2. Store in Key Vault:
```bash
az keyvault secret set \
  --vault-name docufen-prod-kv \
  --name github-token \
  --value "ghp_xxxxxxxxxxxx"
```

3. Use in deployment:
```bash
# With environment variable
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
./deploy-docufen-production.sh -g rg-docufen-prod -c

# Or pass directly (less secure)
./deploy-docufen-production.sh -g rg-docufen-prod -c \
  -p parameters-with-github-creds.json
```

### Container App Registry Configuration

The template automatically configures:
- GitHub Container Registry when image starts with `ghcr.io/`
- Azure Container Registry for other images

## CI/CD Pipeline Integration

### GitHub Actions Workflow Example

Add this to your GitHub Actions workflow to automatically update Container App:

```yaml
- name: Update Container App
  uses: azure/CLI@v1
  with:
    inlineScript: |
      az containerapp update \
        --name docufen-admin-prod \
        --resource-group rg-docufen-prod \
        --image ghcr.io/${{ github.repository }}:${{ github.sha }}
```

### Automated Deployment Script

Create `.github/workflows/deploy-admin.yml`:
```yaml
name: Deploy Admin to Container App

on:
  workflow_run:
    workflows: ["Build & Deploy Staging Server"]
    types:
      - completed
    branches:
      - main

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Container App
        run: |
          az containerapp update \
            --name docufen-admin-prod \
            --resource-group rg-docufen-prod \
            --image ghcr.io/${{ github.repository }}:${{ github.event.workflow_run.head_sha }}
```

## Troubleshooting

### Image Pull Errors

1. Check authentication:
```bash
# Test ghcr.io login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull image manually
docker pull ghcr.io/integritycodes/docufen_server:SHA
```

2. Verify Container App secrets:
```bash
az containerapp secret show \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod
```

### Finding Workflow Run Details

```bash
# List all workflows
gh workflow list

# View specific workflow file
gh workflow view staging.yml

# Get run URL for debugging
gh run list --workflow=staging.yml --json url -q '.[0].url'
```

## Best Practices

1. **Tag Management**: Consider adding semantic version tags in addition to SHA
2. **Security**: Always use Key Vault for storing GitHub tokens
3. **Monitoring**: Set up alerts for failed image pulls
4. **Rollback**: Keep previous image references for quick rollback

## Example: Complete Deployment Flow

```bash
# 1. Set up credentials
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 2. Find latest image
./get-github-image.sh -w staging.yml

# 3. Deploy with Container App
./deploy-docufen-production.sh \
  -g rg-docufen-prod \
  -l australiaeast \
  -c \
  -i "ghcr.io/integritycodes/docufen_server:a1b2c3d4e5f6"

# 4. Verify deployment
az containerapp show \
  --name docufen-admin-prod \
  --resource-group rg-docufen-prod \
  --query properties.template.containers[0].image
```