import React from "react"
import { SidebarLeft } from "../../components/left-sidebar/sidebar-left"
import { Separator } from "../../components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "../../components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { AlertCircle } from "lucide-react"
import DocufenIcon from "@/assets/docufen_icon_v4.svg"
import { useTranslation } from "react-i18next"
import { useAppStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"

export default function DeactivatedAccount() {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })))
  React.useEffect(() => {
    document.title = t('deactivatedAccount.AccountDeactivatedDocufen');
  }, []);

  const handleContactSupport = () => {
    window.location.href = "mailto:support@docufen.com?subject=Deactivated Account Support Request";
  };

  return (
    <SidebarProvider 
      open={sidebarOpen} 
      onOpenChange={setSidebarOpen}
      defaultOpen={true}
    >
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger data-testid="deactivatedAccountPage.sidebarTrigger" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-lg font-medium text-gray-700">
                    {t('deactivatedAccount.AccountDeactivated')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-6 text-gray-600">
          <div className="flex flex-col items-center justify-center max-w-2xl mx-auto mt-8">
            {/* Docufen Logo and Name */}
            <div className="w-16 h-16 mb-4">
              <img src={DocufenIcon} alt={t('account.docufenLogo')} className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-semibold mb-8">docufen</h1>
            
            {/* Main Card */}
            <Card className="bg-white border w-full">
              <CardContent className="p-12">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-3xl font-semibold mb-6 text-gray-800">
                    {t('deactivatedAccount.ThisAccountHasBeenDeactivated')}
                  </h1>
                  
                  <p className="text-lg mb-10 text-gray-600">
                    {t('deactivatedAccount.IfYouBelieveThisIsAnErrorOrNeed')}
                  </p>
                  
                  {/* Support Button */}
                  <Button
                    data-testid="deactivatedAccountPage.contactSupportButton"
                    className="bg-primary hover:bg-primary/90 mb-4 py-6 px-8 text-base"
                    onClick={handleContactSupport}
                  >
                    {t('deactivatedAccount.ContactSupport')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Info Card */}
            <Card className="bg-white border w-full mt-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t('deactivatedAccount.YourAccountHasBeenDeactivatedThisM')} </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
