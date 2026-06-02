import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;
  if (isLoggedIn) return <Navigate to="/discovery" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-container to-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="material-symbols-outlined text-white text-4xl">favorite</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Warm Circle</h1>
        <p className="text-sm text-on-surface-variant mt-1">登录你的账号</p>
      </div>
      <div className="w-full max-w-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#356668",
                  brandAccent: "#2a5254",
                  inputText: "#1c1b1f",
                  inputBackground: "white",
                  inputBorder: "#cac4d0",
                  messageText: "#1c1b1f",
                  messageBackground: "#f5f0ff",
                  messageBorder: "#e8def8",
                  anchorTextColor: "#356668",
                },
                radii: {
                  borderRadiusButton: "9999px",
                  inputBorderRadius: "12px",
                },
              },
            },
            style: {
              button: {
                padding: "16px 24px",
                fontSize: "14px",
                fontWeight: "600",
              },
              input: {
                padding: "16px",
                fontSize: "14px",
              },
              label: {
                fontSize: "13px",
                color: "#49454f",
              },
              container: {
                gap: "12px",
              },
              divider: {
                margin: "8px 0",
              },
              message: {
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "13px",
              },
            },
          }}
          providers={[]}
          view="sign_in"
          showLinks={true}
          redirectTo={window.location.origin + "/#/discovery"}
        />
      </div>
    </div>
  );
}
