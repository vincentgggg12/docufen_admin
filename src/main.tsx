import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerLicense } from '@syncfusion/ej2-base'
import '@/index.css'
import '@/styles/syncfusion.css'
import App from './App.tsx'
import { initAmplitude } from '@/lib/analytics/amplitude'

// registerLicense("Ngo9BigBOggjHTQxAR8/V1NMaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdnWH1ccnVSRWBdUUZ3WEc=") version 28x
// registerLicense("Ngo9BigBOggjHTQxAR8/V1NNaF5cXmZCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXtec3VcQ2ZfUEF1XkNWYUA=") // version 29x
registerLicense("Ngo9BigBOggjHTQxAR8/V1JEaF5cXmtCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXhec3RQRWdcVEJ0V0dWYEk=") // version 30x

// Initialize Amplitude
initAmplitude();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
