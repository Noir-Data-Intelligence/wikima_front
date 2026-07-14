import { useEffect } from 'react';
import { Loader2, XCircle } from 'lucide-react';

/**
 * Gmail OAuth Callback Handler
 * This page receives the OAuth redirect from Google after user grants permission
 * URL format: /GmailOAuthCallback?code=xxx or /GmailOAuthCallback?error=xxx
 */
export default function GmailOAuthCallback() {
  useEffect(() => {
    // Extract code or error from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (window.opener) {
      // Send result back to parent window (Profile page)
      window.opener.postMessage({
        type: 'gmail-auth-callback',
        code: code,
        error: error || null
      }, window.location.origin);
      
      // Close this popup window after sending message
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // If no opener window (direct navigation), redirect to Profile
      setTimeout(() => {
        window.location.href = '/Profile?tab=integrations';
      }, 2000);
    }
  }, []);

  // Extract error if present
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Authorization Failed</h2>
            <p className="text-red-300 mb-4">
              {error === 'access_denied' 
                ? 'You denied access to Gmail.' 
                : `Error: ${error}`}
            </p>
            <p className="text-blue-200 text-sm">This window will close automatically.</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Completing Gmail Connection</h2>
            <p className="text-blue-200">Please wait while we finalize your Gmail integration...</p>
            <p className="text-blue-300 text-sm mt-2">This window will close automatically.</p>
          </>
        )}
      </div>
    </div>
  );
}