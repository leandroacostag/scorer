import React from 'react';

const DebugInfo: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 bg-gray-800 text-white p-2 text-xs opacity-75 z-50">
      <div>API URL: {window.ENV?.API_URL || 'Not set'}</div>
      <div>Auth0 Domain: {window.ENV?.AUTH0_DOMAIN ? 'Set' : 'Not set'}</div>
      <div>Auth0 Client ID: {window.ENV?.AUTH0_CLIENT_ID ? 'Set' : 'Not set'}</div>
      <div>Auth0 Audience: {window.ENV?.AUTH0_AUDIENCE ? 'Set' : 'Not set'}</div>
    </div>
  );
};

export default DebugInfo; 