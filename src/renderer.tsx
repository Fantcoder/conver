import './renderer/browser-mock';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './renderer/styles/index.css';
import { AppShell } from './renderer/components/app/AppShell';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AppShell />
    </React.StrictMode>,
  );
} else {
  console.error('Failed to locate #root container element in index.html');
}
