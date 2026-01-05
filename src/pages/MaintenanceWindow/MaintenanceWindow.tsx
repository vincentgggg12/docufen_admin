import React from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Wrench } from "lucide-react"
import DocufenIcon from "@/assets/docufen_icon_v4.svg"
import { useTranslation } from "react-i18next"

export default function MaintenanceWindow() {
  const { t } = useTranslation();
  
  React.useEffect(() => {
    document.title = t('maintenanceWindow.SiteUnderMaintenance');
  }, [t]);

  // const handleContactSupport = () => {
  //   window.location.href = "mailto:support@docufen.com?subject=Maintenance Window Inquiry";
  // };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
        {/* Docufen Logo and Name */}
        <div className="w-16 h-16 mb-4">
          <img src={DocufenIcon} alt={t('account.docufenLogo')} className="w-full h-full" />
        </div>
        <h1 className="text-2xl font-semibold mb-8">docufen</h1>
        
        {/* Main Card */}
        <Card className="bg-white border w-full">
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              {/* Maintenance Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              
              <h1 className="text-3xl font-semibold mb-6 text-gray-800">
                {t('maintenanceWindow.SiteUnderMaintenance')}
              </h1>
              
              <p className="text-lg mb-6 text-gray-600">
                {t('maintenanceWindow.WeAreCurrentlyPerformingScheduledMaintenance')}
              </p>
              
              <p className="text-base mb-10 text-gray-500">
                {t('maintenanceWindow.WeApologizeForAnyInconvenience')}
              </p>
              
              {/* Support Button
              <Button
                data-testid="maintenanceWindow.contactSupportButton"
                className="bg-primary hover:bg-primary/90 mb-4 py-6 px-8 text-base"
                onClick={handleContactSupport}
              >
                {t('maintenanceWindow.ContactSupport')}
              </Button> */}
            </div>
          </CardContent>
        </Card>
        
        {/* Info Card
        <Card className="bg-white border w-full mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('maintenanceWindow.IfYouNeedImmediateAssistance')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}