import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabaseUrl } from "./supabaseClient";
import MobileLayout from "./components/layout/MobileLayout";
import MessagesPage from "./pages/MessagesPage";
import GroupsPage from "./pages/GroupsPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import ChatRoomPage from "./pages/ChatRoomPage";
import EventDetailPage from "./pages/EventDetailPage";
import GroupChatPage from "./pages/GroupChatPage";
import FollowListPage from "./pages/FollowListPage";
import FilterSettingsPage from "./pages/FilterSettingsPage";
import SettingsPage from "./pages/SettingsPage";
import MessageSettingsPage from "./pages/MessageSettingsPage";
import NewChatPage from "./pages/NewChatPage";
import NewPostPage from "./pages/NewPostPage";
import Login from "./pages/Login";
import RegisterPage from "./pages/RegisterPage";
import WorkDetailPage from "./pages/WorkDetailPage";
import PublishEventPage from "./pages/PublishEventPage";
import PublishWorkPage from "./pages/PublishWorkPage";
import GroupSettingsPage from "./pages/GroupSettingsPage";
import { ToastProvider } from "./hooks/useToast";
import { supabase } from "./supabaseClient";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PostProvider } from "./context/PostContext";
import TaiChiIcon from "./components/common/TaiChiIcon";

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <TaiChiIcon size={48} className="animate-taichi-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AnimatedRoutes({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20, rotateX: 5, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -20, rotateX: -5, filter: "blur(4px)" }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformStyle: "preserve-3d", height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/messages" replace />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/chat/:chatId" element={<ChatRoomPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/group-chat/:groupId" element={<GroupChatPage />} />
      <Route path="/discovery" element={<DiscoveryPage />} />
      <Route path="/event/:eventId" element={<EventDetailPage />} />
      <Route path="/works/:id" element={<WorkDetailPage />} />
      <Route path="/followers" element={<FollowListPage type="followers" />} />
      <Route path="/following" element={<FollowListPage type="following" />} />
      <Route path="/subscriptions" element={<FollowListPage type="subscriptions" />} />
      <Route path="/filter-settings" element={<FilterSettingsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/message-settings" element={<MessageSettingsPage />} />
      <Route path="/new-chat" element={<NewChatPage />} />
      <Route path="/new-post" element={<NewPostPage />} />
      <Route path="/group-settings/:groupId" element={<GroupSettingsPage />} />
      <Route path="/publish-event" element={<PublishEventPage />} />
      <Route path="/publish-work" element={<PublishWorkPage />} />
    </Routes>
  );
}

function App() {
  console.log('Supabase URL:', supabaseUrl)

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={
          <ToastProvider>
            <Routes>
              {/* 公开的个人主页 - 不登录也可访问 */}
              <Route path="/profile/:userId" element={<UserProfilePage />} />
              <Route path="*" element={
                <AuthGuard>
                  <PostProvider>
                    <MobileLayout>
                      <AnimatedRoutes>
                        <AppRoutes />
                      </AnimatedRoutes>
                    </MobileLayout>
                  </PostProvider>
                </AuthGuard>
              } />
            </Routes>
          </ToastProvider>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;

