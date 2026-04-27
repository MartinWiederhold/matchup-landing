import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './pages/Home.jsx';
import Privacy from './pages/Privacy.jsx';
import Impressum from './pages/Impressum.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/impressum" element={<Impressum />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
