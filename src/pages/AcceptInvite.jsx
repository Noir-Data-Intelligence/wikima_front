import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { createPageUrl } from '@/utils';
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AcceptInvite() {
  const [status, setStatus] = useState('loading'); // loading | needs_login | success | error | expired | already_accepted
  const [info, setInfo] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const workspaceId = urlParams.get('workspace');

  useEffect(() => {
    if (!token || !workspaceId) {
      setStatus('error');
      setInfo({ message: 'Invalid invitation link.' });
      return;
    }
    processInvite();
  }, []);

  const processInvite = async () => {
    try {
      const res = await api.functions.invoke('acceptTeamInvite', { token, workspaceId });
      const data = res.data;

      if (data.success) {
        setStatus('success');
        setInfo(data);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = createPageUrl('Dashboard');
        }, 2000);
      } else if (data.needs_login) {
        setStatus('needs_login');
        setInfo(data);
      } else if (data.already_accepted) {
        setStatus('already_accepted');
      } else if (data.expired) {
        setStatus('expired');
      } else {
        setStatus('error');
        setInfo({ message: data.error || 'Something went wrong.' });
      }
    } catch (err) {
      setStatus('error');
      setInfo({ message: err.message || 'Failed to process invitation.' });
    }
  };

  const handleLogin = () => {
    // Redirect to login, then come back to this page to complete the process
    api.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#1c2d5f' }}>
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-3xl font-black text-foreground mb-1">
            Wi<span style={{ color: '#e97c3f' }}>Ki</span>ma
          </div>
          <p className="text-blue-300 text-sm">Business Management Platform</p>
        </div>

        <div className="rounded-2xl border border-border p-8" style={{ backgroundColor: '#1e293b' }}>

          {/* LOADING */}
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Processing invitation...</h2>
              <p className="text-blue-300 text-sm">Please wait a moment.</p>
            </div>
          )}

          {/* NEEDS LOGIN */}
          {status === 'needs_login' && (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'rgba(233,124,63,0.15)' }}>
                <Users className="w-8 h-8" style={{ color: '#e97c3f' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">You've been invited!</h2>
                <p className="text-blue-300 text-sm leading-relaxed">
                  You need to sign in{info?.member_email ? <> with <strong className="text-foreground">{info.member_email}</strong></> : null} to accept this invitation and join the team.
                </p>
              </div>
              <Button
                onClick={handleLogin}
                className="w-full text-foreground font-semibold py-3"
                style={{ backgroundColor: '#e97c3f' }}
              >
                Sign in to Accept →
              </Button>
              <p className="text-blue-400 text-xs">
                Don't have an account? Sign in will let you create one.
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Welcome to the team! 🎉</h2>
              <p className="text-blue-300 text-sm">
                You've successfully joined the workspace. Redirecting to your dashboard...
              </p>
              {info?.email_mismatch && (
                <p className="text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  Note: You signed in with a different email than the one invited ({info.expected_email}). The invitation was still accepted.
                </p>
              )}
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-green-400 animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}

          {/* ALREADY ACCEPTED */}
          {status === 'already_accepted' && (
            <div className="space-y-4">
              <CheckCircle className="w-14 h-14 text-blue-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Already joined</h2>
              <p className="text-blue-300 text-sm">This invitation has already been accepted.</p>
              <Button
                onClick={() => window.location.href = createPageUrl('Dashboard')}
                className="w-full text-foreground"
                style={{ backgroundColor: '#e97c3f' }}
              >
                Go to Dashboard →
              </Button>
            </div>
          )}

          {/* EXPIRED */}
          {status === 'expired' && (
            <div className="space-y-4">
              <XCircle className="w-14 h-14 text-yellow-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Invitation expired</h2>
              <p className="text-blue-300 text-sm">This invitation link has expired (valid for 7 days). Please ask the team admin to send a new invitation.</p>
            </div>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Invalid invitation</h2>
              <p className="text-blue-300 text-sm">{info?.message || 'This invitation link is invalid or has already been used.'}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}