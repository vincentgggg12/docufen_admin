import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarLeft } from '@/components/left-sidebar/sidebar-left';
import { useTranslation } from 'react-i18next';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';

const NotInvitedPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserStore(useShallow((state) => ({
    user: state.user
  })));

  useEffect(() => {
    // Track not invited access
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_NOT_INVITED_ACCESS, {
      email_domain: user?.email?.split('@')[1] || 'unknown',
      redirect_page: '/notinvited'
    });
  }, [user]);

  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
    <div className="w-full h-screen flex items-center justify-center bg-slate-50">
      <Card className="max-w-md w-full shadow-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('notInvite.title.accessRestricted')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-700">
            {t('notInvited.description.contactAdmin')}
          </p>
          
          <div className="bg-slate-100 p-4 rounded-md">
            <h3 className="font-medium text-sm mb-2">{t('notInvited.whattodo')}</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>
                {t('notInvited.contactyourAdmin')}
              </li>
              <li>{t('notInvited.provideYourEmail')}</li>
              <li>{t('notInvited.askForInvitation')}</li>
            </ul>
          </div>
          
        </CardContent>
      </Card>
    </div>
    </SidebarInset>
    </SidebarProvider>
  );
};

export default NotInvitedPage;