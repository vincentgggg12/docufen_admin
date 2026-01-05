import React from 'react';
import { UserX } from 'lucide-react'; // Changed icon
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarLeft } from '@/components/left-sidebar/sidebar-left';
import { useTranslation } from 'react-i18next';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';

const LoginInactiveModal: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserStore(useShallow((state) => ({
    user: state.user
  })));

  React.useEffect(() => {
    document.title = t('loginInactive.pageTitle', 'Account Disabled');
    
    // Track deactivated user access
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_DEACTIVATED_ACCESS, {
      user_id: user?.userId || 'unknown',
      redirect_page: '/login-inactive'
    });
  }, [t, user]);

  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
        <div className="w-full h-screen flex items-center justify-center bg-slate-50">
          <Card className="max-w-md w-full shadow-lg mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <UserX className="h-12 w-12 text-orange-500" /> {/* Icon and color updated */}
              </div>
              <CardTitle className="text-2xl font-bold">
                {t('loginInactive.title', 'Account Disabled')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-slate-700">
                {t('loginInactive.description', 'Your profile has been disabled.')}
              </p>
              
              <div className="bg-slate-100 p-4 rounded-md">
                <h3 className="font-medium text-sm mb-2">
                  {t('loginInactive.whatToDoTitle', 'What to do:')}
                </h3>
                <p className="text-sm text-slate-600">
                  {t('loginInactive.contactUserManager', "Please contact a DocuFen user with the role 'User Manager' to re-activate your account.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LoginInactiveModal;
