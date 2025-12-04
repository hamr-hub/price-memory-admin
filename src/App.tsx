import { GitHubBanner, Refine, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { useNotificationProvider, AuthPage } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemedLayout } from "@refinedev/antd";
import type { AccessControlProvider, LiveProvider } from "@refinedev/core";
import { dataProvider } from "./dataProvider";
import supabaseAuthProvider from "./supabaseAuth";
import { hasSupabase } from "./supabase";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { liveProvider as supabaseLiveProvider } from "./providers/liveSupabase";
import ProductsPage from "./pages/Products";
import ProductsCreate from "./pages/ProductsCreate";
import ProductsEdit from "./pages/ProductsEdit";
import ProductsShow from "./pages/ProductsShow";
import PublicPoolPage from "./pages/PublicPool";
import CollectionsListPage from "./pages/CollectionsList";
import CollectionShowPage from "./pages/CollectionShow";
import { Header } from "./components/header";
import PushesPage from "./pages/Pushes";
import NodesPage from "./pages/Nodes";
import CrawlTestPage from "./pages/CrawlTest";
import { API_BASE, api } from "./api";
const restProvider = dataProvider;

const localAuthProvider: any = {
  login: async ({ email }: any) => {
    const role = email === "admin" || email === "admin@example.com" ? "admin" : "guest";
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("role", role);
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, name: email || "演示用户", avatar: undefined })
    );
    try { await api.createUser(email || "demo", "演示用户"); } catch {}
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const authenticated = !!localStorage.getItem("token");
    return { authenticated, redirectTo: authenticated ? undefined : "/login" };
  },
  getIdentity: async () => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  onError: async (error: any) => ({ error }) as any,
};

const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action, params }: any) => {
    const role = localStorage.getItem("role") || "guest";
    let can = true;
    if (resource === "products" && (action === "export" || action === "delete" || action === "edit")) {
      can = role === "admin";
    }
    if (resource === "collections" && (action === "share" || action === "export")) {
      if (role === "admin") {
        can = true;
      } else {
        const raw = localStorage.getItem("user");
        const userId = raw ? (JSON.parse(raw) || {}).id : undefined;
        const id = params?.id;
        if (!id || !userId) {
          can = false;
        } else {
          try {
            const res = await fetch(`${API_BASE}/collections/${id}`);
            const j = await res.json();
            can = j?.data?.owner_user_id === userId;
          } catch {
            can = false;
          }
        }
      }
    }
    if (resource === "public-pool" && action === "select") {
      can = !!localStorage.getItem("token");
    }
    return { can, reason: can ? undefined : "无权限" };
  },
};

function App() {
  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                dataProvider={restProvider}
                authProvider={hasSupabase ? supabaseAuthProvider : localAuthProvider}
                accessControlProvider={accessControlProvider}
                liveProvider={supabaseLiveProvider as LiveProvider}
                resources={[
                  { name: "products", list: "/products", create: "/products/create", edit: "/products/edit/:id", show: "/products/show/:id" },
                  { name: "public-pool", list: "/pool" },
                  { name: "collections", list: "/collections", show: "/collections/show/:id" },
                  { name: "pushes", list: "/pushes" },
                  { name: "nodes", list: "/nodes" },
                  { name: "crawl-test", list: "/crawl-test" },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "68Tn3q-k8Oh2h-ZA1WwU",
                }}
              >
                <Routes>
                  <Route path="/login" element={<AuthPage type="login" />} />
                  <Route
                    element={
                      <Authenticated key="auth" fallback={<Navigate to="/login" replace />}> 
                        <ThemedLayout Header={Header} />
                      </Authenticated>
                    }
                  >
                    <Route index element={<Navigate to="/products" replace />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/create" element={<ProductsCreate />} />
                    <Route path="/products/edit/:id" element={<ProductsEdit />} />
                    <Route path="/products/show/:id" element={<ProductsShow />} />
                    <Route path="/pool" element={<PublicPoolPage />} />
                    <Route path="/collections" element={<CollectionsListPage />} />
                    <Route path="/collections/show/:id" element={<CollectionShowPage />} />
                    <Route path="/pushes" element={<PushesPage />} />
                    <Route path="/nodes" element={<NodesPage />} />
                    <Route path="/crawl-test" element={<CrawlTestPage />} />
                  </Route>
                </Routes>
                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
