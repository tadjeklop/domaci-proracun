import React, { useState, useEffect } from 'react';

const C = { bl: '#2563eb', mt: '#888', bd: '#e8e6e1' };

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('dp_pwa_dismissed');
    if (isStandalone || dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible) return null;

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem('dp_pwa_dismissed', '1');
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: '#fff', border: `1px solid ${C.bd}`, borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', gap: 10, zIndex: 9999,
      fontSize: 14, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 20 }}>📲</span>
      <span style={{ color: '#333', fontWeight: 500 }}>Namesti Domači proračun na zaslon</span>
      <button onClick={install} style={{
        background: C.bl, color: '#fff', border: 'none', borderRadius: 6,
        padding: '5px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}>Namesti</button>
      <button onClick={dismiss} style={{
        background: 'none', border: '1px solid #ddd', borderRadius: 6,
        padding: '5px 10px', fontSize: 14, cursor: 'pointer', color: C.mt,
      }}>Zapri</button>
    </div>
  );
}
