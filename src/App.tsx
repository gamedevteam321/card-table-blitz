
import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Lazy load pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const NotFound = lazy(() => import('@/pages/NotFound'));

/**
 * Main App component that sets up routing and global providers
 */
function App() {
  // Configure routes for the application
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Index />,
      errorElement: <NotFound />
    },
    {
      path: '*',
      element: <NotFound />
    }
  ]);

  return (
    // Set up providers for global features
    <ToastProvider>
      {/* Router provider manages navigation */}
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
      
      {/* Global toast notifications */}
      <Toaster />
    </ToastProvider>
  );
}

export default App;
