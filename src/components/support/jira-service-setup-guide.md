# Complete Jira Service Management API Setup Guide for Customer Portal Integration

## Overview
This guide explains how to properly set up Jira Service Management (JSM) and configure the API integration so that:
1. Customers can create tickets and add comments from your web app
2. Support agents can reply in Jira Service Management
3. Comments are properly visible to customers in your web app

## Prerequisites
- Jira Service Management Cloud instance
- API token for authentication
- A service desk project in JSM

## Step 1: Jira Service Management Project Configuration

### 1.1 Create or Configure Service Desk Project
1. Go to your Jira Service Management instance
2. Create a new Service Management project or use existing one
3. Note down:
   - **Service Desk ID** (found in project settings)
   - **Project Key** (e.g., `SUPPORT`)

### 1.2 Configure Request Types
1. Go to **Project settings** → **Request types**
2. Create a request type (e.g., "General Support")
3. Note the **Request Type ID** (visible in the URL when editing)
4. Ensure the request type is enabled and configured

### 1.3 Configure Customer Permissions
1. Go to **Project settings** → **Customer permissions**
2. Ensure these settings are enabled:
   - ✅ Customers can view their requests
   - ✅ Customers can comment on their requests
   - ✅ Customers can receive notifications

### 1.4 Configure Comment Visibility Settings
1. Go to **Project settings** → **Request security levels**
2. Ensure default visibility is set to "Customers"
3. Train agents to use "Reply to customer" not "Internal comment"

## Step 2: API User Setup

### 2.1 Create Service Desk API User
1. Create a dedicated user account for API access (e.g., `api-service@company.com`)
2. Grant this user **Service Desk Agent** role:
   - Go to **Project settings** → **Users and roles**
   - Add user to **Service Desk Team**

### 2.2 Generate API Token
1. Log in as the API user
2. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
3. Click "Create API token"
4. Name it (e.g., "Docufen Integration")
5. Copy and save the token securely

### 2.3 Get Cloud ID and Service Desk ID
```bash
# Get Cloud ID
curl -u your-email@company.com:your-api-token \
  https://your-domain.atlassian.net/_edge/tenant_info

# Get Service Desk ID
curl -u your-email@company.com:your-api-token \
  https://your-domain.atlassian.net/rest/servicedeskapi/servicedesk
```

## Step 3: Server Environment Configuration

Add these to your `.env` file:

```bash
# Jira Service Management Configuration
JIRA_SERVICE_EMAIL=api-service@company.com
JIRA_API_TOKEN=your-api-token-here
JIRA_CLOUD_ID=your-cloud-id-here
JIRA_PROJECT_KEY=SUPPORT
JIRA_SERVICE_DESK_ID=1  # From step 1.1
JIRA_ISSUE_TYPE_ID=10001  # Your request type ID
JIRA_REQUEST_TYPE_ID=25  # From step 1.2
```

## Step 4: API Integration Code

### 4.1 Update Server Routes for Service Desk API

Update your `support.ts` to use the Service Desk API properly:

```typescript
// support.ts - Key changes for proper comment handling

const JIRA_BASE_URL = `https://api.atlassian.com/ex/jira/${config.JIRA_CLOUD_ID}`
const JIRA_SERVICE_DESK_API_URL = `${JIRA_BASE_URL}/rest/servicedeskapi`

// Creating customer requests (use Service Desk API)
router.post('/ticket/create/', 
  ensureAuthenticated,
  checkAuthorization,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { summary, description, priority = "Medium" } = req.body;
      const user = req.user;
      
      // Create request using Service Desk API
      const jiraPayload = {
        serviceDeskId: config.JIRA_SERVICE_DESK_ID,
        requestTypeId: config.JIRA_REQUEST_TYPE_ID,
        requestFieldValues: {
          summary: summary,
          description: description,
          priority: { name: priority }
        },
        raiseOnBehalfOf: user.email, // Customer email
        requestParticipants: [user.email]
      };
      
      // Use Service Desk API endpoint
      const jiraResponse = await jiraPost('/rest/servicedeskapi/request', jiraPayload);
      
      // ... rest of your code
    } catch (error) {
      // ... error handling
    }
  }
);

// Fetching comments with proper visibility
router.get('/ticket/list/', async (req: Request, res: Response): Promise<void> => {
  try {
    // ... existing ticket fetching code ...
    
    // For each ticket, fetch comments using Service Desk API
    for (const ticket of tickets) {
      try {
        // Use Service Desk API to get customer-visible comments
        const commentsResponse = await jiraGet(
          `/rest/servicedeskapi/request/${ticket.ticketKey}/comment`,
          { 
            public: true,  // Only get public comments
            internal: false, // Exclude internal comments
            expand: 'participant,renderedBody'
          }
        );
        
        if (commentsResponse.values) {
          ticket.comments = commentsResponse.values
            .filter((comment: any) => comment.public === true) // Extra safety check
            .map((comment: any) => {
              // Parse the comment body properly
              const bodyContent = comment.body?.content || [];
              return {
                id: comment.id,
                author: comment.author.displayName,
                authorEmail: comment.author.emailAddress || '',
                comment: bodyContent, // Keep the structured content
                created: new Date(comment.created).getTime(),
                isSupport: comment.author.accountType === 'atlassian' || 
                          comment.author.emailAddress !== user.email
              };
            });
        }
      } catch (commentError) {
        logger.error(`Failed to fetch comments for ${ticket.ticketKey}:`, commentError);
        ticket.comments = [];
      }
    }
    
    res.status(200).json({ 
      success: true,
      tickets 
    });
    
  } catch (error) {
    // ... error handling
  }
});

// Adding customer comments (ensure they're public)
router.post('/ticket/:ticketKey/comment',
  ensureAuthenticated,
  checkAuthorization,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketKey } = req.params;
      const { comment } = req.body;
      const user = req.user;
      
      // Add comment using Service Desk API to ensure it's public
      const commentPayload = {
        body: comment,
        public: true  // Explicitly mark as public
      };
      
      // Use Service Desk API endpoint
      await jiraPost(
        `/rest/servicedeskapi/request/${ticketKey}/comment`,
        commentPayload
      );
      
      res.status(200).json({ 
        success: true,
        message: "Comment added successfully"
      });
      
    } catch (error) {
      // ... error handling
    }
  }
);
```

### 4.2 Important API Endpoints

Use these Service Desk API endpoints for proper customer interaction:

```typescript
// Service Desk API endpoints (for customer-facing operations)
const SERVICE_DESK_ENDPOINTS = {
  // Create customer request
  CREATE_REQUEST: '/rest/servicedeskapi/request',
  
  // Get/Add comments (public by default)
  GET_COMMENTS: '/rest/servicedeskapi/request/{issueIdOrKey}/comment',
  ADD_COMMENT: '/rest/servicedeskapi/request/{issueIdOrKey}/comment',
  
  // Get customer requests
  GET_MY_REQUESTS: '/rest/servicedeskapi/request',
  GET_REQUEST: '/rest/servicedeskapi/request/{issueIdOrKey}',
  
  // Manage participants
  GET_PARTICIPANTS: '/rest/servicedeskapi/request/{issueIdOrKey}/participant',
  ADD_PARTICIPANTS: '/rest/servicedeskapi/request/{issueIdOrKey}/participant'
};

// Regular Jira API endpoints (for agent operations)
const JIRA_API_ENDPOINTS = {
  // Search issues
  SEARCH: '/rest/api/3/search',
  
  // Get issue details
  GET_ISSUE: '/rest/api/3/issue/{issueIdOrKey}'
};
```

## Step 5: Testing Comment Visibility

### 5.1 Test Customer Comment Creation
```bash
# Test adding a comment as customer
curl -X POST https://your-app.com/api/support/ticket/SUPPORT-123/comment \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "This is a customer comment"
  }'
```

### 5.2 Test in Jira Service Management
1. Open the ticket in JSM
2. Click "Reply to customer" (not "Add internal comment")
3. Type your response
4. Click "Reply"

### 5.3 Verify in Your App
1. Refresh your support ticket list
2. Open the ticket
3. You should see both:
   - Customer comments from your app
   - Agent replies from JSM

## Step 6: Common Issues and Solutions

### Issue: Comments not showing in app
**Solution**: Check if comments are marked as internal in JSM
```javascript
// Debug: Log comment visibility
logger.debug(`Comment visibility - public: ${comment.public}, jsdPublic: ${comment.jsdPublic}`);
```

### Issue: 403 Forbidden when creating comments
**Solution**: Ensure API user has Service Desk Agent role

### Issue: Comments show as internal by default
**Solution**: 
1. Check project settings for default comment visibility
2. Use Service Desk API endpoints (not regular Jira API)
3. Explicitly set `public: true` in requests

## Step 7: Best Practices

### 7.1 Always Use Service Desk API for Customer Operations
```javascript
// ✅ Good - Service Desk API
await fetch(`${JIRA_BASE_URL}/rest/servicedeskapi/request/${ticketKey}/comment`, {
  method: 'POST',
  body: JSON.stringify({ body: comment, public: true })
});

// ❌ Bad - Regular Jira API (may create internal comments)
await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/comment`, {
  method: 'POST',
  body: JSON.stringify({ body: { content: [...] } })
});
```

### 7.2 Train Support Agents
Create a guide for agents:
- Always use "Reply to customer" button
- Never use "Add internal comment" for customer communication
- Check comment visibility indicator before posting

### 7.3 Handle Comment Structure Properly
Service Desk API returns different comment structure:
```javascript
// Service Desk API comment structure
{
  "id": "10000",
  "body": "Comment text",  // Plain text
  "public": true,
  "author": {
    "displayName": "John Doe",
    "emailAddress": "john@example.com"
  },
  "created": "2024-01-15T10:00:00.000+0000"
}

// Regular Jira API comment structure
{
  "id": "10000",
  "body": {
    "type": "doc",
    "version": 1,
    "content": [...]  // ADF format
  },
  "jsdPublic": true,  // Note: different property name
  "author": {...}
}
```

## Step 8: Webhook Integration (Optional)

To get real-time updates when agents reply:

### 8.1 Configure Webhook in JSM
1. Go to **System** → **Webhooks**
2. Create webhook:
   - URL: `https://your-app.com/api/support/webhook/jira`
   - Events: Comment created, Comment updated
   - JQL: `project = SUPPORT`

### 8.2 Handle Webhook Events
```typescript
router.post('/webhook/jira', async (req: Request, res: Response) => {
  const { webhookEvent, issue, comment } = req.body;
  
  if (webhookEvent === 'comment_created' && comment?.public) {
    // Notify customers of new public comment
    await notifyCustomerOfReply(issue.key, comment);
  }
  
  res.status(200).json({ received: true });
});
```

## Conclusion

By following this guide:
1. Customer comments created through your app will be public
2. Agent replies marked as "Reply to customer" will be visible
3. Internal comments will remain hidden from customers
4. The integration will work as expected

Remember: The key is using the Service Desk API for customer operations and ensuring comments are explicitly marked as public.