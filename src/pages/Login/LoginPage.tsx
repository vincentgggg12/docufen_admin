import { Button } from "../../components/ui/button";
import DocufenIcon from "@/assets/docufen_icon_v4.svg";
import useAuthorisedUser from "@/hooks/AuthorisedUser";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";


export function LoginPage() {
  const { manualLogin, user } = useAuthorisedUser(false);
  const [loading, setLoading] = React.useState(false);
  const [loginStartTime, setLoginStartTime] = React.useState<number | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user == null) return
    if (loading) return
    
    // Track successful login
    if (loginStartTime) {
      const duration = Date.now() - loginStartTime;
      trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGIN_SUCCESS, {
        login_method: 'microsoft',
        user_id: user.userId,
        is_new_user: false, // We can enhance this later
        login_duration_ms: duration,
        user_email: user.email?.split('@')[1] || '', // domain only
        organization_name: user.tenants[user.tenantName]?.companyName || ''
      });
      setLoginStartTime(null);
    }
    
    // Check if we're redirecting to a saved path
    const savedPath = sessionStorage.getItem('currentPath');
    if (savedPath) {
      trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_SESSION_REDIRECTED, {
        redirect_reason: 'saved_path_after_login',
        from_page: 'login',
        to_page: savedPath
      });
    }
    
    navigate("/home")
  }, [user, loading, loginStartTime, navigate])

  const handleMicrosoftLogin = () => {
    setLoading(true)
    setLoginStartTime(Date.now());
    
    // Track login initiation with new event system
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGIN_INITIATED, {
      login_method: 'microsoft',
      page: 'login'
    });
    
    const currentPath = sessionStorage.getItem('currentPath') || undefined; 
    if (currentPath) {
      sessionStorage.removeItem('currentPath');
    }
    manualLogin(currentPath)
  };
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
      <div className="max-w-xs w-full mx-auto flex flex-col items-center">
        {/* Logo */}
        <div className="w-12 h-12 mb-4">
          <img src={DocufenIcon} alt="Docufen Logo" className="w-full h-full" />
        </div>
        
        {/* Title and description */}
        <h1 className="text-xl font-semibold mb-1">docufen</h1>
        <p className="text-sm text-gray-500 mb-6">{t('loginPage.signInOrSignUp')}</p>
        
        {/* Microsoft sign-in button */}
        <Button 
          variant="outline" 
          className="w-[90%] flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm"
          onClick={handleMicrosoftLogin}
          disabled={loading}
          data-testid="loginPage.loginButton"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("states.processing...")}
            </span>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path fill="currentColor" d="M0 32h214.6v214.6H0V32zm233.4 0H448v214.6H233.4V32zM0 265.4h214.6V480H0V265.4zm233.4 0H448V480H233.4V265.4z" />
              </svg>
              {t('loginPage.continueWithMicrosoft')}
            </>
          )}
        </Button>
        
        {/* Terms of service text */}
        <p className="text-center text-[10px] text-gray-500 mt-3 max-w-[200px]">
          {t('loginPage.byClickingContinueYouAgreeToOur')}{" "}
          <a href="https://www.docufen.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">
            {t('loginPage.termsOfService')}
          </a>{" "}
          and{" "}
          <a href="https://www.docufen.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">
            {t('loginPage.privacyPolicy')}
          </a>.
        </p>
      </div>
    </div>
  );
} 