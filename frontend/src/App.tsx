import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionBootstrap } from './components/SessionBootstrap';
import { LoginPage } from './pages/Login';
import { PageLoader } from './components/PageLoader';
const OrdersPage = lazy(() =>
  import('./pages/Orders').then((m) => ({ default: m.OrdersPage })),
);
const ProductsPage = lazy(() =>
  import('./pages/Products').then((m) => ({ default: m.ProductsPage })),
);
const ReportsPage = lazy(() =>
  import('./pages/Reports').then((m) => ({ default: m.ReportsPage })),
);
const AssignmentPage = lazy(() =>
  import('./pages/Assignment').then((m) => ({ default: m.AssignmentPage })),
);

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      placeholderData: keepPreviousData,
      retry: 1,
    },
  },
});

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <SessionBootstrap>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route
              path="/orders"
              element={
                <LazyPage>
                  <OrdersPage />
                </LazyPage>
              }
            />
            <Route
              path="/products"
              element={
                <LazyPage>
                  <ProductsPage />
                </LazyPage>
              }
            />
            <Route
              path="/reports"
              element={
                <LazyPage>
                  <ReportsPage />
                </LazyPage>
              }
            />
            <Route
              path="/assignment"
              element={
                <LazyPage>
                  <AssignmentPage />
                </LazyPage>
              }
            />
          </Route>
        </Routes>
      </SessionBootstrap>
    </QueryClientProvider>
  );
}
