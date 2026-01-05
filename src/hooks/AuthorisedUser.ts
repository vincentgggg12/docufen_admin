import { useShallow } from "zustand/shallow";
import { useDocumentStore, useUserStore } from "@/lib/stateManagement";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function useAuthorisedUser(autoLogin = true) {
  const [trigger, setTrigger] = React.useState(autoLogin)
  const navigate = useNavigate()
  
  const { 
    user, 
    login, 
    fetchUser, 
    loading, 
    isAttemptingLogin,
    setIsAttemptingLogin,
    userType,
    setLoading
  } = useUserStore(useShallow((state) => ({
    user: state.user,
    fetchUser: state.fetchUser,
    login: state.login,
    loading: state.loading,
    isAttemptingLogin: state.isAttemptingLogin,
    setIsAttemptingLogin: state.setIsAttemptingLogin,
    userType: state.userType,
    setLoading: state.setLoading,
  })))
  const [ready, setReady] = React.useState(user != null)
  
  const { tenantName } = useDocumentStore(useShallow((state) => ({
    tenantName: state.tenantName
  })))

  React.useEffect(() => {
    const isReallyAttempting = useUserStore.getState().isAttemptingLogin;
    if (user != null && user.email !== "" && user.tenants[tenantName] != null) {
      setReady(true);
      return
    }
    if (!trigger || loading || isReallyAttempting || user != null) return;

    setIsAttemptingLogin(true);
    
    fetchUser()
      .then((success: boolean) => {
        setReady(true);
        if (!success && autoLogin) {
          navigate("/home")
          // login(tenantName);
        }
      })
      .catch((err) => {
        if(err instanceof Error) {
          console.log("Problem fetching user: " + err.message);
        }
        setReady(true);
      })
      .finally(() => {
        // Reset login attempt flag after a delay
        setReady(true);
        setTimeout(() => {
          setIsAttemptingLogin(false);
        }, 1000);
      });
  }, [user, fetchUser, loading, tenantName, login, trigger, setIsAttemptingLogin, isAttemptingLogin, setReady]);

  const manualLogin = (nextUrl?: string) => {
    setLoading(true)
    login("", nextUrl)
    // setIsAttemptingLogin(false); // Reset before attempting manual login
    // setTrigger(true);
  }
  // console.log("WPT-loading: " + loading.toString() + " ready: " + ready.toString())
  return { 
    user, 
    userType,
    loading: loading || !ready,
    setTrigger,
    manualLogin
  };
}
