import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// عکس‌های شکسته یا بدون منبع را پنهان می‌کنیم تا آیکون تصویر خراب نمایش داده نشود.
document.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement) {
      target.style.visibility = 'hidden';
    }
  },
  true,
);

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
