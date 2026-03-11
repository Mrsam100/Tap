import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import DashboardSkeleton from './components/DashboardSkeleton';
import { ErrorBoundary } from './src/lib/errorBoundary';
import { useAuthStore } from './src/stores/authStore';
import ToastContainer from './components/Toast';

// Eager: landing pages (critical for first paint)
import Features from './pages/Features';
import Pricing from './pages/Pricing';

// Lazy: auth pages (rarely needed on initial load)
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Legal = lazy(() => import('./pages/Legal'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const BlogIndex = lazy(() => import('./pages/BlogIndex'));

// Lazy: dashboard pages (only loaded when authenticated)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Builder = lazy(() => import('./src/features/builder/Builder'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Monetization = lazy(() => import('./pages/Monetization'));
const Audience = lazy(() => import('./pages/Audience'));
const Settings = lazy(() => import('./pages/Settings'));

// Lazy: public profile
const PublicProfile = lazy(() => import('./pages/PublicProfile'));

const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Known app routes — anything not matching these is a public profile username
const APP_ROUTES = new Set([
  '/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email',
  '/build', '/features', '/pricing', '/analytics', '/monetization', '/audience',
  '/privacy', '/terms', '/blog',
  '/dashboard',
]);

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.has(pathname) || pathname.startsWith('/blog/') || pathname.startsWith('/dashboard');
}

// Minimal fallback for lazy-loaded pages outside the dashboard
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-jam-red rounded-full animate-spin" />
  </div>
);

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { pathname } = useLocation();
  const isBuilder = pathname === '/build' || pathname === '/dashboard/links' || pathname === '/dashboard/appearance';
  const isPublicProfile = !isAppRoute(pathname);
  const isDashboard = pathname.startsWith('/dashboard');

  // Public profiles render without chrome (no navbar/footer)
  if (isPublicProfile) {
    return <>{children}</>;
  }

  // Dashboard has its own layout — no navbar/footer
  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen font-sans text-ink overflow-x-hidden selection:bg-jam-red selection:text-white bg-cream flex flex-col dark:bg-black dark:text-white">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {!isBuilder && <Footer />}
      <ScrollToTop />
    </div>
  );
}

const App: React.FC = () => {
  const fetchUser = useAuthStore(s => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Tap — The AI Landing Page Builder for Modern Creators</title>
        <meta name="description" content="Build a beautiful, high-converting landing page in seconds with Tap. The AI-powered builder for architects, designers, and founders." />
        <meta name="keywords" content="AI landing page builder, link in bio, portfolio builder, modern design, personal website, creator tools" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tap.bio/" />
        <meta property="og:title" content="Tap — The AI Landing Page Builder for Modern Creators" />
        <meta property="og:description" content="Build a beautiful, high-converting landing page in seconds with Tap." />
        <meta property="og:image" content="https://picsum.photos/seed/tap-og/1200/630" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://tap.bio/" />
        <meta property="twitter:title" content="Tap — The AI Landing Page Builder for Modern Creators" />
        <meta property="twitter:description" content="Build a beautiful, high-converting landing page in seconds with Tap." />
        <meta property="twitter:image" content="https://picsum.photos/seed/tap-twitter/1200/630" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Tap",
              "operatingSystem": "Web",
              "applicationCategory": "DesignApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250"
              }
            }
          `}
        </script>
      </Helmet>
      <Router>
          <ScrollToTopOnNavigate />
          <Layout>
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                    {/* Public pages */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/privacy" element={<Legal />} />
                    <Route path="/terms" element={<Legal />} />
                    <Route path="/blog" element={<BlogIndex />} />
                    <Route path="/blog/all" element={<BlogIndex />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />

                    {/* Dashboard (unified) */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<DashboardSkeleton />}>
                            <DashboardLayout />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Dashboard />} />
                      <Route path="links" element={<Builder />} />
                      <Route path="appearance" element={<Builder />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="monetization" element={<Monetization />} />
                      <Route path="audience" element={<Audience />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* Legacy route redirects */}
                    <Route path="/build" element={<Navigate to="/dashboard/links" replace />} />
                    <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
                    <Route path="/monetization" element={<Navigate to="/dashboard/monetization" replace />} />
                    <Route path="/audience" element={<Navigate to="/dashboard/audience" replace />} />

                    {/* Public profile — must be last before catch-all */}
                    <Route path="/:username" element={<PublicProfile />} />
                    <Route path="*" element={<Home />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Layout>
      </Router>
      <ToastContainer />
    </HelmetProvider>
  );
};

export default App;
