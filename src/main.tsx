(window as any).isSessionAuthenticated = () => Boolean(sessionStorage.getItem('vault_session_key') || localStorage.getItem('admin_passcode') || localStorage.getItem('sina_admin_auth'));
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
