import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function RegisterPage() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;
  if (isLoggedIn) return <Navigate to="/messages" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-container to-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="material-symbols-outlined text-white text-4xl">how_to_reg</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface">注册账号</h1>
        <p className="text-sm text-on-surface-variant mt-1">发现身边有趣的人和事</p>
      </div>
      <div className="w-full max-w-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#95490d",
                  brandAccent: "#7a3d0b",
                  inputText: "#1c1b1f",
                  inputBackground: "white",
                  inputBorder: "#cac4d0",
                  messageText: "#1c1b1f",
                  messageBackground: "#f5f0ff",
                  messageBorder: "#e8def8",
                  anchorTextColor: "#95490d",
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
                background: "#95490d",
                color: "white",
                borderRadius: "9999px",
              },
              input: {
                padding: "16px",
                fontSize: "14px",
                borderRadius: "8px",
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
          view="sign_up"
          showLinks={true}
          redirectTo={window.location.origin + "/#/discovery"}
          localization={{
            variables: {
              sign_up: {
                email_label: '电子邮件',
                password_label: '创建密码',
                button_label: '注册',
              },
              sign_in: {
                email_label: '电子邮件',
                password_label: '密码',
                button_label: '登录',
              },
              forgotten_password: {
                email_label: '电子邮件',
                button_label: '发送重置链接',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
