import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState } from 'react';

export const Route = createFileRoute('/api-test')({
  component: ApiTestPage,
});

interface UserData {
  userId: string;
  clerkUserId: string;
  currency: string;
  created_at: string;
  message: string;
}

function ApiTestPage() {
  const { getToken, isSignedIn } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    if (!isSignedIn) {
      setError('Please sign in first');
      return;
    }

    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      // Get the JWT token from Clerk
      const token = await getToken();

      if (!token) {
        throw new Error('Failed to get token');
      }

      // Call the API with the token
      const response = await fetch('import.meta.env.VITE_API_UPL/api/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user');
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            <span className="gradient-text">API Test</span>
          </h1>
          <p className="text-slate-400">Test the authentication and API integration</p>
        </div>

        {/* Main Card */}
        <div className="glass border border-white/10 rounded-2xl p-8 animate-fadeIn">
          {/* Status Badge */}
          <div className="mb-6 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isSignedIn ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'} animate-pulse`}></div>
            <p className="text-slate-300 font-semibold">
              Status:{' '}
              {isSignedIn ? (
                <span className="text-emerald-400">Authenticated ✓</span>
              ) : (
                <span className="text-red-400">Not Authenticated</span>
              )}
            </p>
          </div>

          {/* Test Button */}
          <button
            onClick={testApi}
            disabled={!isSignedIn || loading}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-violet-600/30 disabled:shadow-none mb-6 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Testing API...
              </span>
            ) : (
              '🚀 Test /api/me Endpoint'
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-5 glass border border-red-500/50 rounded-xl bg-red-500/10 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-400 text-lg">✕</span>
                </div>
                <div>
                  <p className="text-red-300 font-bold mb-1">Error</p>
                  <p className="text-red-300/80 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Display */}
          {userData && (
            <div className="mb-6 p-5 glass border border-emerald-500/50 rounded-xl bg-emerald-500/10 animate-fadeIn">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-emerald-300 font-bold">Success!</p>
                  <p className="text-emerald-300/80 text-sm">User data retrieved from database</p>
                </div>
              </div>
              <div className="space-y-3 ml-11">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Database User ID</p>
                  <code className="block px-3 py-2 glass border border-white/10 rounded-lg text-white text-sm font-mono">
                    {userData.userId}
                  </code>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Clerk User ID</p>
                  <code className="block px-3 py-2 glass border border-white/10 rounded-lg text-white text-sm font-mono">
                    {userData.clerkUserId}
                  </code>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Currency</p>
                  <code className="block px-3 py-2 glass border border-white/10 rounded-lg text-white text-sm font-mono">
                    {userData.currency}
                  </code>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Created At</p>
                  <code className="block px-3 py-2 glass border border-white/10 rounded-lg text-white text-sm font-mono">
                    {new Date(userData.created_at).toLocaleString()}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">ℹ️</span>
              How It Works
            </h3>
            <ol className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-violet-600/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Sign in with Clerk authentication</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-violet-600/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Retrieve JWT token from Clerk</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-violet-600/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Send authenticated request to /api/me endpoint</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-violet-600/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Backend verifies token and creates user in database if needed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-violet-600/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <span>Response returns user data (ID, currency, created_at)</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
