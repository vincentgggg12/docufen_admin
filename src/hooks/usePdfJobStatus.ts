import { SERVERURL } from '@/lib/server'
import { useState, useEffect, useRef, useCallback } from 'react'


interface PdfJobStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found'
  progress: number
  message: string
  jobId?: string
  pdfUrl?: string
  time?: number
  error?: string
}

interface PdfJobStatusHookResult {
  status: PdfJobStatusResponse['status']
  progress: number
  message: string
  pdfUrl?: string
  time?: number
  error?: string
  isPolling: boolean
  startPolling: (documentId: string) => void
  stopPolling: () => void
}

export const usePdfJobStatus = (
  options?: {
    onComplete?: (pdfUrl: string, time: number) => void
    onFailure?: (error?: string) => void
    pollInterval?: number  // Default 3000ms. Error retries use 2x backoff.
    maxAttempts?: number   // Default 120 (~6 minutes with 3s interval)
  }
): PdfJobStatusHookResult => {
  const [jobStatus, setJobStatus] = useState<PdfJobStatusResponse>({
    status: 'pending',
    progress: 0,
    message: 'Initializing...'
  })
  const [isPolling, setIsPolling] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)
  const documentIdRef = useRef<string>('')
  const isPollingRef = useRef(false)

  // Store callbacks in refs to avoid recreating pollStatus when options change
  const onCompleteRef = useRef(options?.onComplete)
  const onFailureRef = useRef(options?.onFailure)

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = options?.onComplete
    onFailureRef.current = options?.onFailure
  }, [options?.onComplete, options?.onFailure])

  const pollInterval = options?.pollInterval || 3000
  const maxAttempts = options?.maxAttempts || 120

  const stopPollingInternal = useCallback(() => {
    setIsPolling(false)
    isPollingRef.current = false
    pollCountRef.current = 0
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const pollStatus = useCallback(async (): Promise<void> => {
    try {
      const currentDocId = documentIdRef.current
      if (!currentDocId) return

      // const authorization = await getAuthorization()
      const response = await fetch(
        `${SERVERURL}document/pdf-job-status/${currentDocId}`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: PdfJobStatusResponse = await response.json()
      console.log('PDF job status:', data)
      setJobStatus(data)

      // Handle completion
      if (data.status === 'completed' && data.pdfUrl && onCompleteRef.current) {
        console.log('PDF creation completed:', data.pdfUrl)
        onCompleteRef.current(data.pdfUrl, data.time || Date.now())
        stopPollingInternal()
        return
      }

      // Handle failure
      if (data.status === 'failed' && onFailureRef.current) {
        console.log('PDF creation failed:', data.error)
        onFailureRef.current(data.error)
        stopPollingInternal()
        return
      }

      // Handle not_found - document may already have PDF
      if (data.status === 'not_found') {
        // Check if we have pdfUrl in response (already exists case)
        if (data.pdfUrl && onCompleteRef.current) {
          onCompleteRef.current(data.pdfUrl, Date.now())
        } else if (onFailureRef.current) {
          // No pdfUrl means job doesn't exist - notify failure to reset UI state
          onFailureRef.current('Job not found')
        }
        stopPollingInternal()
        return
      }

      // Check max attempts
      pollCountRef.current += 1
      if (pollCountRef.current >= maxAttempts) {
        setJobStatus({
          status: 'failed',
          progress: 0,
          message: 'PDF creation timeout - taking longer than expected',
          error: 'Timeout'
        })
        if (onFailureRef.current) {
          onFailureRef.current('Timeout')
        }
        stopPollingInternal()
        return
      }

      // Schedule next poll
      if (isPollingRef.current) {
        timeoutRef.current = setTimeout(pollStatus, pollInterval)
      }

    } catch (error) {
      console.error('Error polling PDF job status:', error)

      // Retry on error if not at max attempts
      if (pollCountRef.current < maxAttempts && isPollingRef.current) {
        pollCountRef.current += 1
        timeoutRef.current = setTimeout(pollStatus, pollInterval * 2) // Back off on error
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setJobStatus({
          status: 'failed',
          progress: 0,
          message: 'Failed to check PDF status',
          error: errorMessage
        })
        if (onFailureRef.current) {
          onFailureRef.current(errorMessage)
        }
        stopPollingInternal()
      }
    }
  }, [pollInterval, maxAttempts, stopPollingInternal])

  const startPolling = useCallback((documentId: string) => {
    documentIdRef.current = documentId
    if (!isPollingRef.current) {
      console.log('Starting PDF job polling for document:', documentId)
      setIsPolling(true)
      isPollingRef.current = true
      pollCountRef.current = 0
      setJobStatus({
        status: 'pending',
        progress: 0,
        message: 'Starting PDF creation...'
      })
      pollStatus()
    } else {
      console.log('PDF job polling already in progress')
    }
  }, [pollStatus])

  const stopPolling = useCallback(() => {
    console.log('Stopping PDF job polling')
    stopPollingInternal()
  }, [stopPollingInternal])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop polling without calling state setters (to avoid React warnings on unmount)
      isPollingRef.current = false
      pollCountRef.current = 0
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Clear callback refs to prevent calling callbacks after unmount
      onCompleteRef.current = undefined
      onFailureRef.current = undefined
    }
  }, [])

  return {
    status: jobStatus.status,
    progress: jobStatus.progress,
    message: jobStatus.message,
    pdfUrl: jobStatus.pdfUrl,
    time: jobStatus.time,
    error: jobStatus.error,
    isPolling,
    startPolling,
    stopPolling
  }
}

export default usePdfJobStatus
