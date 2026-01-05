import { SERVERURL } from '@/lib/server'
import { useModalStore } from '@/lib/stateManagement'
import { useState, useEffect, useRef, useCallback } from 'react'

interface ConversionStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  url?: string
  uniqueFilename?: string
  error?: string
}

interface ConversionStatusHookResult {
  status: ConversionStatusResponse['status']
  progress: number
  message: string
  url?: string
  uniqueFilename?: string
  error?: string
  isPolling: boolean
  startPolling: (documentId: string, filename: string) => void
}
export const UPLOAD_CUT = 0.4

export const useConversionStatus = (
  documentId: string,
  options?: {
    onComplete?: (url: string, uniqueFilename: string) => void;
    onFailure?: (error?: string) => void;
  }
): ConversionStatusHookResult => {
  // console.log('useConversionStatus called with:', { documentId })
  
  const [conversionStatus, setConversionStatus] = useState<ConversionStatusResponse>({
    status: 'pending',
    progress: 0,
    message: 'Queued for conversion'
  })
  const [isPolling, setIsPolling] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)
  const maxPollAttempts = 60 // 6 minutes (60 * 6 seconds)

  // Use refs to always have current values
  const documentIdRef = useRef(documentId)
  const filenameRef = useRef<string>('')
  const isPollingRef = useRef(false)
  
  // Update refs when props change
  useEffect(() => {
    console.log('Updating refs:', { documentId })
    documentIdRef.current = documentId
  }, [documentId])

  const pollConversionStatus = useCallback(async (): Promise<void> => {
    try {
      const currentDocId = documentIdRef.current
      const currentFilename = filenameRef.current
      
      console.log('Polling conversion status:', { currentDocId, currentFilename })
      
      const response = await fetch(`${SERVERURL}upload/${currentDocId}/conversion-status/${currentFilename}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data: ConversionStatusResponse = await response.json()
      console.log('Conversion status data:', data)
      const setUploadProgress = useModalStore.getState().setUploadProgress
      setUploadProgress(Math.round(100 * UPLOAD_CUT + (1-UPLOAD_CUT)*data.progress))
      setConversionStatus(data)
      
      // Handle completion callback
      if (data.status === 'completed' && data.url && options?.onComplete) {
        console.log('Calling onComplete callback with URL:', data.url)
        options.onComplete(data.url, data.uniqueFilename || '')
      }
      
      // Handle failure callback
      if (data.status === 'failed' && options?.onFailure) {
        console.log('Calling onFailure callback with error:', data.error)
        options.onFailure(data.error)
      }
      
      // Stop polling if conversion is complete or failed
      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false)
        isPollingRef.current = false
        pollCountRef.current = 0
        return
      }
      
      // Check if we've exceeded max attempts
      pollCountRef.current += 1
      if (pollCountRef.current >= maxPollAttempts) {
        setConversionStatus({
          status: 'failed',
          progress: 0,
          message: 'Conversion timeout - taking longer than expected',
          error: 'Conversion timeout'
        })
        if (options?.onFailure) {
          console.log('Calling onFailure callback for timeout')
          options.onFailure('Conversion timeout')
        }
        setIsPolling(false)
        isPollingRef.current = false
        pollCountRef.current = 0
        return
      }
      
      // Schedule next poll
      if (isPollingRef.current) {
        // console.log('Scheduling next poll in 6 seconds')
        timeoutRef.current = setTimeout(pollConversionStatus, 6000) // 6 seconds
      }
      
    } catch (error) {
      console.error('Error polling conversion status:', error)
      
      // If we haven't reached max attempts, try again
      if (pollCountRef.current < maxPollAttempts && isPollingRef.current) {
        pollCountRef.current += 1
        timeoutRef.current = setTimeout(pollConversionStatus, 6000)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setConversionStatus({
          status: 'failed',
          progress: 0,
          message: 'Failed to check conversion status',
          error: errorMessage
        })
        if (options?.onFailure) {
          console.log('Calling onFailure callback for error:', errorMessage)
          options.onFailure(errorMessage)
        }
        setIsPolling(false)
        isPollingRef.current = false
        pollCountRef.current = 0
      }
    }
  }, [options])

  // Manual polling control
  const startPolling = useCallback((documentId: string, filename: string) => {
    filenameRef.current = filename;
    documentIdRef.current = documentId;
    if (!isPollingRef.current && documentIdRef.current && filenameRef.current) {
      setIsPolling(true);
      isPollingRef.current = true;
      pollCountRef.current = 0;
      pollConversionStatus();
    } else if (isPollingRef.current) {
      console.log('Polling already in progress');
    } else {
      console.log('Cannot start polling - missing documentId or filename');
    }
  }, [pollConversionStatus]);

  // No automatic effects needed - polling is controlled manually via startPolling()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Return directly without memoization to ensure React detects all changes
  // console.log('Returning hook value with:', {
  //   status: conversionStatus.status,
  //   url: conversionStatus.url,
  //   isPolling
  // })
  
  return {
    status: conversionStatus.status,
    progress: conversionStatus.progress,
    message: conversionStatus.message,
    url: conversionStatus.url,
    uniqueFilename: conversionStatus.uniqueFilename,
    error: conversionStatus.error,
    isPolling,
    startPolling
  }
}

export default useConversionStatus