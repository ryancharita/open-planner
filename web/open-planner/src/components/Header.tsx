import { Link } from '@tanstack/react-router';
import { useUser, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

import { useState } from 'react';
import {
  Home,
  Menu,
  X,
  Calendar,
  LayoutDashboard,
  StickyNote,
  DollarSign,
  TrendingUp,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

export default function Header() {
  const { isSignedIn, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center glass border-b border-white/5 shadow-xl">
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
          size="icon"
          aria-label="Open menu"
        >
          <Menu size={22} className="text-white" />
        </Button>
        <h1 className="ml-4 text-xl font-bold">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 group-hover:shadow-fuchsia-500/50 transition-all">
              <span className="text-white font-black text-lg">F</span>
            </div>
            <span className="gradient-text hidden sm:block font-extrabold tracking-tight">
              FinancePlanner
            </span>
          </Link>
        </h1>
        <div className="ml-auto flex items-center gap-3">
          {isSignedIn ? (
            <>
              <span className="text-sm text-slate-300 hidden md:block px-3 py-1.5 rounded-lg bg-white/5">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
              <SignOutButton>
                <Button variant="gradient">
                  Sign Out
                </Button>
              </SignOutButton>
            </>
          ) : (
            <SignInButton mode="modal">
              <Button variant="gradientCyan">
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 glass border-r border-white/10 text-white shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20">
          <h2 className="text-xl font-bold gradient-text">Navigation</h2>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            aria-label="Close menu"
          >
            <X size={22} />
          </Button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Home</span>
          </Link>

          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Dashboard</span>
          </Link>

          <Link
            to="/monthly"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <Calendar size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Monthly</span>
          </Link>

          {/* <Link
            to="/api-test"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <Network size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">API Test</span>
          </Link> */}

          <Link
            to="/categories"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <StickyNote size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Categories</span>
          </Link>

          <Link
            to="/expenses"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <DollarSign size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Expenses</span>
          </Link>

          <Link
            to="/income"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <TrendingUp size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Income</span>
          </Link>

          <Link
            to="/loans"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Loans</span>
          </Link>

          <Link
            to="/recurring-items"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
            }}
          >
            <RefreshCw size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Recurring Items</span>
          </Link>



          {/* Demo Links Start */}
          {/* <div className="mt-4 pt-4 border-t border-white/10">
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Demo Pages
            </p>

            <Link
              to="/demo/start/server-funcs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
              activeProps={{
                className:
                  'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
              }}
            >
              <SquareFunction size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Server Functions</span>
            </Link>

            <Link
              to="/demo/start/api-request"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
              activeProps={{
                className:
                  'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
              }}
            >
              <Network size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold">API Request</span>
            </Link>

            <div className="flex flex-row items-center justify-between">
              <Link
                to="/demo/start/ssr"
                onClick={() => setIsOpen(false)}
                className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
                activeProps={{
                  className:
                    'flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
                }}
              >
                <StickyNote size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-semibold">SSR Demos</span>
              </Link>
              <button
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                onClick={() =>
                  setGroupedExpanded((prev) => ({
                    ...prev,
                    StartSSRDemo: !prev.StartSSRDemo,
                  }))
                }
              >
                {groupedExpanded.StartSSRDemo ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
            </div>
            {groupedExpanded.StartSSRDemo && (
              <div className="flex flex-col ml-6 space-y-1 animate-fadeIn">
                <Link
                  to="/demo/start/ssr/spa-mode"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group"
                  activeProps={{
                    className:
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
                  }}
                >
                  <StickyNote size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">SPA Mode</span>
                </Link>

                <Link
                  to="/demo/start/ssr/full-ssr"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group"
                  activeProps={{
                    className:
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
                  }}
                >
                  <StickyNote size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Full SSR</span>
                </Link>

                <Link
                  to="/demo/start/ssr/data-only"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all group"
                  activeProps={{
                    className:
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 shadow-lg shadow-violet-600/20 transition-all group',
                  }}
                >
                  <StickyNote size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Data Only</span>
                </Link>
              </div>
            )}
          </div> */}

          {/* Demo Links End */}
        </nav>
      </aside>
    </>
  );
}
