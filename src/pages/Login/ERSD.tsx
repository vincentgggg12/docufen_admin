import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import DocufenIcon from "@/assets/docufen_icon_v4.svg";
import { SERVERURL } from "@/lib/server";
import { useAccountStore, useUserStore } from "@/lib/stateManagement";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/shallow";
import { getDefaultERSDText } from "../AccountPage/components/ComplianceERSDModal";
import { useTranslation } from "react-i18next";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";

export function ERSD() {
  const [isChecked, setIsChecked] = useState(false);
  const [isAgreeLoading, setIsAgreeLoading] = useState(false);
  const [error, setError] = useState("");
  const { setErsdSigned } = useUserStore(useShallow((state) => ({
    setErsdSigned: state.setErsdSigned,
  })));
  const { ersdText, setErsdText } = useAccountStore(useShallow((state) => ({
    ersdText: state.ersdText,
    setErsdText: state.setErsdText,
  })));
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch custom ERSD text on component mount
  useEffect(() => {
    if (ersdText.length == 0) {
      setErsdText(getDefaultERSDText(t));
    }
    
    // Track ERSD agreement viewed
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ERSD_AGREEMENT_VIEWED, {
      language: t('locale') || 'en',
      is_custom_text: ersdText !== getDefaultERSDText(t)
    });
  }, [ersdText, setErsdText, t]);

  const handleCancel = () => {
    // Track ERSD declined
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ERSD_AGREEMENT_DECLINED, {
      language: t('locale') || 'en'
    });
    navigate(-1); // Go back to the previous page
  };

  const handleAgree = async () => {
    if (isChecked) {
      setIsAgreeLoading(true);
      try {
        // Call the agree endpoint to save agreement
        const response = await fetch(SERVERURL + 'agree/', {
          method: "PUT",
          credentials: "include"
        });
        if (!response.ok) {
          console.error('Failed to save agreement');
          throw new Error('Failed to save agreement');
        }
        
        // Track ERSD agreement accepted
        trackAmplitudeEvent(AMPLITUDE_EVENTS.ERSD_AGREEMENT_ACCEPTED, {
          language: t('locale') || 'en',
          agreement_version: '1.0' // You may want to version this
        });
        
        setErsdSigned(Date.now()); // Update the ERSD signed state
        // Save locally and navigate back
        navigate("/home");
      } catch (err) {
        console.error('Error agreeing to ERSD:', err);
        
        // Track error
        trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
          error_type: 'api_error',
          error_code: 'ERSD_SAVE_FAILED',
          error_message: err instanceof Error ? err.message : 'Failed to save agreement',
          error_source: 'ERSD.handleAgree',
          page_name: 'ERSD Agreement',
          action_attempted: 'accept_ersd'
        });
        
        setError(t('account.compliance.ersdModal.couldNotSaveAgreement'));
        setIsAgreeLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full mx-auto flex flex-col items-center">
        {/* Logo */}
        <div className="w-12 h-12 mb-4">
          <img src={DocufenIcon} alt="Docufen Logo" className="w-full h-full" />
        </div>
        
        {/* Title and description */}
        <h1 className="text-xl font-semibold mb-1">docufen</h1>
        <h2 className="text-lg font-semibold mt-6 mb-2">{t('account.compliance.ersdAriaLabel')}</h2>
        
        {/* ERSD Content */}
        {error ? (
          <div className="w-full text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="border rounded-md p-4 mb-6 w-full max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
            {ersdText}
          </div>
        )}
        
        {/* Agreement checkbox */}
        <div className="flex items-start space-x-2 mb-6 w-full">
          <Checkbox 
            id="agreement" 
            checked={isChecked}
            onCheckedChange={(checked) => setIsChecked(checked as boolean)}
            className="mt-1"
            data-testid="ersd-agreement-checkbox"
          />
          <label 
            htmlFor="agreement" 
            className="text-sm text-gray-700"
          >
            {t('account.compliance.ersdModal.byClickingIAgree')}
          </label>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm mb-4 w-full text-center">{error}</div>
        )}
        
        {/* Buttons */}
        <div className="flex space-x-4 w-full justify-end">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="px-6"
            disabled={isAgreeLoading}
            data-testid="ersd-cancel-button"
          >
            {t('buttonTitle.cancel')}
          </Button>
          <Button 
            variant="default"
            onClick={handleAgree}
            disabled={!isChecked || isAgreeLoading}
            className="px-6"
            data-testid="ersd-agree-button"
          >
            {isAgreeLoading ? t('states.processing...') : t('account.compliance.ersdModal.iAgree')}
          </Button>
        </div>
      </div>
    </div>
  );
}
