import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { arvanProxyUrl } from './utils/arvanUrl';
import './index.css';

// اگر فایل آروان مستقیم نیامد (۴۰۳ یا قطعی)، یک بار از مسیر هم‌دامنه‌ی
// سایت امتحان می‌کنیم؛ آن مسیر با امضای سمت سرور همیشه جواب می‌دهد.
// در نهایت تصویر خراب را پنهان می‌کنیم تا آیکون شکسته نمایش داده نشود.
document.addEventListener(
  'error',
  (event) => {
    const target = event.target;

    if (target instanceof HTMLImageElement) {
      if (!target.dataset.arvanFallback) {
        const current = target.currentSrc || target.src;
        const fallback = arvanProxyUrl(current);
        if (fallback && fallback !== current) {
          target.dataset.arvanFallback = '1';
          target.src = fallback;
          return;
        }
      }
      target.style.visibility = 'hidden';
      return;
    }

    if (target instanceof HTMLVideoElement) {
      if (target.dataset.arvanFallback) return;
      const current = target.currentSrc || target.src;
      const fallback = arvanProxyUrl(current);
      if (fallback && fallback !== current) {
        target.dataset.arvanFallback = '1';
        target.src = fallback;
        target.load();
      }
    }
  },
  true,
);

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
