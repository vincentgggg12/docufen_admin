export const testMetadata = {
  Test001: {
    'Step 1': {
      acceptanceCriteria: [
        'Application login page is displayed',
        'User can log in with Microsoft credentials',
        'Setup wizard is completed successfully',
        'User Manager invitation is sent'
      ],
    },
    'Step 2': {
      acceptanceCriteria: [
        'User Manager accepts invitation',
        'User Manager status changes to "Active"',
        'Microsoft User ID field is populated',
        'Type field shows "Internal"'
      ],
    },
  },
}; 