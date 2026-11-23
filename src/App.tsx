import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { prefsStore } from './core/api/stores';
import { useStore } from './core/api/persistedStore';
import { ToastProvider } from './shared/ui/Toasts';

function App() {
  const prefs = useStore(prefsStore);

  // Display preferences apply to the whole page.
  useEffect(() => {
    document.documentElement.style.fontSize = prefs.textSize === 'large' ? '18px' : '';
    document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion);
  }, [prefs.textSize, prefs.reduceMotion]);

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;
