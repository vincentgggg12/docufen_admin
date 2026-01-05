import { useShallow } from "zustand/shallow";
import { useNavigate } from "react-router-dom"
import { useUserStore } from "@/lib/stateManagement";
import React from "react";
import { hasCapability } from "@/lib/authorisation";
import { useTranslation } from "react-i18next";


interface HomePageProps {
}

export const HomePage: React.FC<HomePageProps> = () => {
  const { userType, user } = useUserStore(useShallow(state => ({ 
    logout: state.logout, userType: state.userType, user: state.user,})));
  const navigate = useNavigate();
  const { t } = useTranslation();

  console.log("Homepage: userRole: " + JSON.stringify(userType), user)
  React.useEffect(() => {
    if (user == null) return
    if (userType == null) {
      navigate("/setup" );
    }else if (hasCapability(userType, "MANAGE_SITE")) {
      navigate("/account" );
    }else if (hasCapability(userType, "MANAGE_USERS")){
      navigate("/users" );
    } else if (hasCapability(userType, "COMPLETE_DOCUMENTS")) {
      navigate("/documents");
    } else {
      navigate("/documents");
    }
  }, [userType, user])

    return (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: "100vw"}}>
        <div>{t('loadingRefreshYourBrowserIfTheScreenDoesNotLoadAutomatically')}</div>
    </div>
    )
}
