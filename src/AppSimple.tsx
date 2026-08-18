import React from 'react';

export default function AppSimple() {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'blue', 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '24px',
      zIndex: 999999
    }}>
      SYSTEM ONLINE - INLINE STYLES
    </div>
  );
}
