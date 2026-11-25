import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// A new release removes the old files. A phone that still holds the old page gets one fresh reload instead of a blank screen.
const boot = window as unknown as { __aurvedReload?: () => boolean };
window.addEventListener('vite:preloadError', (event) => {
  if (boot.__aurvedReload?.()) event.preventDefault();
});
// Remove the cache-busting mark that the reload added to the address.
const address = new URL(window.location.href);
if (address.searchParams.has('_r')) {
  address.searchParams.delete('_r');
  window.history.replaceState(null, '', address.toString());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
