"use client";

import React, { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to config if no configuration exists
    const hasConfig = localStorage.getItem('dinstar_config');
    if (!hasConfig) {
      window.location.href = '/sms-config';
    } else {
      window.location.href = '/sms-messages';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Duke ngarkuar Dinstar SMS Module...</p>
      </div>
    </div>
  );
}