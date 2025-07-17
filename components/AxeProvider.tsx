'use client';

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import axe from '@axe-core/react';

interface AxeProviderProps {
  children: React.ReactNode;
}

export default function AxeProvider({ children }: AxeProviderProps) {
  useEffect(() => {
    // Only run axe in development
    if (process.env.NODE_ENV === 'development') {
      axe(React, ReactDOM, 1000);
    }
  }, []);

  return <>{children}</>;
} 