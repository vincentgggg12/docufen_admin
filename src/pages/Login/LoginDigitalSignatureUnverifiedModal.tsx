import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarLeft } from '@/components/left-sidebar/sidebar-left';
import { useTranslation } from 'react-i18next';
import { useAppStore, useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';

const LoginDigitalSignatureUnverifiedModal: React.FC = () => {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })))
  const { user } = useUserStore(useShallow((state) => ({
    user: state.user
  })));

  React.useEffect(() => {
    document.title = t('loginDigSigUnverified.pageTitle', 'Digital Signature Unverified');
    
    // Track digital signature unverified access
    trackAmplitudeEvent(AMPLITUDE_EVENTS.DIGITAL_SIGNATURE_UNVERIFIED, {
      user_id: user?.userId || 'unknown',
      verification_required: true
    });
  }, [t, user]);

  return (
    <SidebarProvider 
      open={sidebarOpen} 
      onOpenChange={setSidebarOpen}
      defaultOpen={true}
    >
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
        <div className="w-full h-screen flex items-center justify-center bg-slate-50">
          <Card className="max-w-md w-full shadow-lg mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ShieldAlert className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {t('loginDigSigUnverified.title', 'Digital Signature Unverified')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-slate-700">
                {t('loginDigSigUnverified.description', 'Your digital signature requires verification to continue.')}
              </p>
              
              <div className="bg-slate-100 p-4 rounded-md">
                <h3 className="font-medium text-sm mb-2">
                  {t('loginDigSigUnverified.whatToDoTitle', 'What to do:')}
                </h3>
                <p className="text-sm text-slate-600">
                  {t('loginDigSigUnverified.contactUserManager', "Please contact a DocuFen user with the role 'User Manager' and request your Digital Signature Verification to be completed in order to use DocuFen.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LoginDigitalSignatureUnverifiedModal;
