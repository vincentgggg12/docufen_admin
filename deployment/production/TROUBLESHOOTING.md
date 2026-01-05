# Deployment Troubleshooting Guide

## Error: "The content for this response was already consumed"

This error typically occurs during ARM template validation when there's a mismatch between the template and parameters file.

### Quick Fix

Use the correct parameter file for your deployment:

```bash
# For base deployment (without Container App)
./deploy-docufen-production.sh -g rg-docufen-prod \
  -p parameters-production-base.json

# For Container App deployment
./deploy-docufen-production.sh -g rg-docufen-prod -c \
  -p parameters-production-containerapp.json
```

### Root Causes

1. **Parameter Mismatch**: Using Container App parameters with base template
2. **JSON Formatting Issues**: Invalid JSON syntax or encoding
3. **Large Template Size**: Template exceeds Azure limits
4. **Circular Dependencies**: Resources depending on each other

### Diagnostic Steps

1. **Validate JSON Syntax**
```bash
# Check template
python3 -m json.tool template-production.json > /dev/null

# Check parameters
python3 -m json.tool parameters-production-base.json > /dev/null
```

2. **Run Validation Script**
```bash
python3 fix-template-validation.py
```

3. **Test with Minimal Template**
```bash
# Deploy minimal template to isolate issues
az deployment group create \
  --resource-group rg-docufen-prod \
  --template-file minimal-template.json
```

4. **Check Parameter Compatibility**
```bash
# List template parameters
jq '.parameters | keys' template-production.json

# List parameter values
jq '.parameters | keys' parameters-production-base.json

# They should match!
```

## Common Validation Errors

### Error: "Invalid template"

**Solution**: Check template structure
```bash
# Required fields
grep -E '"\$schema"|"contentVersion"|"resources"' template-production.json
```

### Error: "Parameter 'X' is not defined"

**Solution**: Ensure parameter exists in template
```json
// In template
"parameters": {
  "parameterName": {
    "type": "string"
  }
}

// In parameters file
"parameters": {
  "parameterName": {
    "value": "actualValue"
  }
}
```

### Error: "Circular dependency detected"

**Solution**: Check resource dependencies
```bash
# Find dependsOn references
grep -n "dependsOn" template-production.json
```

## File Structure

Ensure you have the correct files:

```
deployment/production/
├── template-production.json                    # Base template (no Container App)
├── template-production-with-containerapp.json  # With Container App
├── parameters-production-base.json            # For base template
├── parameters-production-containerapp.json    # For Container App template
├── Deploy-DocufenProduction.ps1              # PowerShell deployment
└── deploy-docufen-production.sh              # Bash deployment
```

## Step-by-Step Deployment

### Without Container App
```bash
# 1. Clean and prepare template
python3 clean-template.py

# 2. Validate
python3 fix-template-validation.py

# 3. Deploy
./deploy-docufen-production.sh \
  -g rg-docufen-prod \
  -t template-production.json \
  -p parameters-production-base.json
```

### With Container App
```bash
# 1. Clean and prepare template
python3 clean-template.py
python3 add-container-app-v2.py

# 2. Validate
python3 fix-template-validation.py

# 3. Deploy
./deploy-docufen-production.sh \
  -g rg-docufen-prod \
  -c \
  -t template-production-with-containerapp.json \
  -p parameters-production-containerapp.json
```

## Azure CLI Validation

For detailed error messages:

```bash
# Verbose validation
az deployment group validate \
  --resource-group rg-docufen-prod \
  --template-file template-production.json \
  --parameters @parameters-production-base.json \
  --verbose --debug 2> debug.log

# Check debug log
grep -i error debug.log
```

## Reset and Start Fresh

If issues persist:

```bash
# 1. Backup current files
mkdir backup
cp *.json backup/

# 2. Regenerate clean templates
python3 clean-template.py template-with-mongo.json template-production-clean.json

# 3. Test with minimal parameters
echo '{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {}
}' > minimal-params.json

# 4. Validate
az deployment group validate \
  --resource-group rg-docufen-prod \
  --template-file template-production-clean.json \
  --parameters minimal-params.json
```

## Getting Help

1. **Check Azure Activity Log**
```bash
az monitor activity-log list \
  --resource-group rg-docufen-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)Z \
  --query "[?contains(operationName.value, 'validate')]"
```

2. **Export Working Template**
If you have a working deployment:
```bash
az group export \
  --name rg-docufen-existing \
  --include-parameter-defaults > working-template.json
```

3. **Contact Support**
Include:
- Template file
- Parameters file  
- Exact error message
- Output of validation script