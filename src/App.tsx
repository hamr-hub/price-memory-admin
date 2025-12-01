import { GitHubBanner, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { useNotificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import type { AccessControlProvider, AuthBindings } from "@refinedev/core";
import simpleRest from "@refinedev/simple-rest";
import { ColorModeContextProvider } from "./contexts/color-mode";
import ProductsPage from "./pages/Products";
import ProductsCreate from "./pages/ProductsCreate";
import ProductsEdit from "./pages/ProductsEdit";
import ProductsShow from "./pages/ProductsShow";
import { Header } from "./components/header";
import { API_BASE } from "./api";
const restProvider = simpleRest(API_BASE);

const authProvider: AuthBindings = {
  login: async ({ email, password, providerName }) => {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, name: "演示用户", avatar: undefined })
    );
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const authenticated = !!localStorage.getItem("token");
    return { authenticated };
  },
  getIdentity: async () => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  onError: async (error) => ({ error }) as any,
};

const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const role = localStorage.getItem("role") || "guest";
    const can = role === "admin" ? true : !(resource === "products" && action === "export");
    return { can, reason: can ? undefined : "无导出权限" };
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
                authProvider={authProvider}
                accessControlProvider={accessControlProvider}
                resources={[
                  { name: "products", list: "/products", create: "/products/create", edit: "/products/edit/:id", show: "/products/show/:id" },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "68Tn3q-k8Oh2h-ZA1WwU",
                }}
              >
                <Header />
                  <Routes>
                    <Route index element={<Navigate to="/products" replace />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/create" element={<ProductsCreate />} />
                    <Route path="/products/edit/:id" element={<ProductsEdit />} />
                    <Route path="/products/show/:id" element={<ProductsShow />} />
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
