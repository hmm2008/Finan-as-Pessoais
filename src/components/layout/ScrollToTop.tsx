import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Component that resets scroll position to top on every navigation change.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top of the window
    window.scrollTo(0, 0);
    
    // Also try to scroll any main content container if it exists
    // This is useful if the scroll is managed inside a div (like in a dashboard layout)
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
