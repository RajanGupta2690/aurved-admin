import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { prefsStore } from './core/api/stores';
import { useStore } from './core/api/persistedStore';
import { configureRegion } from './core/i18n/format';
import { ToastProvider } from './shared/ui/Toasts';

function App() {
  const prefs = useStore(prefsStore);

  // Display preferences apply to the whole page.
  configureRegion({ locale: prefs.locale, timeZone: prefs.timeZone, currency: prefs.currency });
  useEffect(() => {
    document.documentElement.lang = (prefs.locale ?? 'en-IN').split('-')[0];
    document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes((prefs.locale ?? 'en-IN').split('-')[0]) ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('contrast-high', prefs.contrast === 'high');
    document.documentElement.style.fontSize = prefs.textSize === 'large' ? '18px' : '';
    document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion);
  }, [prefs.textSize, prefs.reduceMotion, prefs.locale, prefs.contrast]);

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;
