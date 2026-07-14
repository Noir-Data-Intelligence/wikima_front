import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Gmail OAuth Callback Handler
 * This page receives the OAuth redirect from Google after user grants permission
 */
export default function GmailCallback() {
  useEffect(() => {
    // Extract code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (window.opener) {
      // Send result back to parent window
      window.opener.postMessage({
        type: 'gmail-auth-callback',
        code: code,
        error: error
      }, window.location.origin);
      
      // Close this window
      window.close();
    } else {
      // If no opener (shouldn't happen), redirect to profile
      window.location.href = '/Profile?tab=integrations';
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-blue-200 text-lg">Completing Gmail connection...</p>
        <p className="text-blue-300 text-sm mt-2">This window will close automatically.</p>
      </div>
    </div>
  );
}