import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

// GitHub Pages SPA fallback: restore the original route from 404.html redirect.
// When 404.html redirects to /?p=<original>, we rewrite the URL back without reloading.
const params = new URLSearchParams(window.location.search);
const p = params.get('p');
if (p) {
  window.history.replaceState(null, '', decodeURIComponent(p));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

