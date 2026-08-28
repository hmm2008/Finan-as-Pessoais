import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomPageNav } from './BottomPageNav';
import { PageLoader } from './PageLoader';
import { usePin, usePreferences } from '../../contexts';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { lock } = usePin();
  const { prefs } = usePreferences();

  const mainBgColor = prefs.customStyles?.global?.backgroundColor;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main 
          className={`flex-1 overflow-y-auto ${mainBgColor ? '' : 'bg-background'} min-h-0 transition-colors duration-300`}
          style={{ backgroundColor: mainBgColor }}
        >
          <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full pb-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {/* Fixed Quick Navigation Toolbar across all pages */}
        <BottomPageNav />
      </div>
    </div>
  );
}
