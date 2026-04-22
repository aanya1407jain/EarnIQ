import React from 'react';

export default function Spinner({ size = 40, fullPage = true }) {
  const spinner = (
    <div style={{
      width: size, height: size,
      border: `3px solid rgba(124,111,255,.15)`,
      borderTop: `3px solid #7c6fff`,
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
  );

  if (!fullPage) return spinner;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {spinner}
    </div>
  );
}
