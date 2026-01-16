import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Bell,
  Calendar,
  PieChart,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const features = [
    {
      icon: <Wallet className="w-12 h-12 text-violet-400" />,
      title: 'Track Your Spending',
      description:
        'Monitor all your expenses in one place. Organize transactions by categories and see where your money goes.',
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-fuchsia-400" />,
      title: 'Financial Insights',
      description:
        'Get actionable insights into your spending patterns. Make smarter financial decisions with data-driven recommendations.',
    },
    {
      icon: <PieChart className="w-12 h-12 text-cyan-400" />,
      title: 'Visual Analytics',
      description:
        'Beautiful charts and graphs help you understand your finances at a glance. See trends and patterns over time.',
    },
    {
      icon: <Target className="w-12 h-12 text-emerald-400" />,
      title: 'Budget Goals',
      description:
        'Set savings goals and budget limits. Track your progress and stay on top of your financial objectives.',
    },
    {
      icon: <Calendar className="w-12 h-12 text-amber-400" />,
      title: 'Recurring Transactions',
      description:
        'Automatically track recurring bills and subscriptions. Never miss a payment or forget about a subscription.',
    },
    {
      icon: <Bell className="w-12 h-12 text-rose-400" />,
      title: 'Smart Reminders',
      description:
        'Get notified when bills are due or when you\'re approaching budget limits. Stay in control of your finances.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 animate-pulse"></div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-slate-300">Your Personal Finance Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight">
            Take Control of Your{' '}
            <span className="gradient-text">Finances</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-4 font-light max-w-3xl mx-auto">
            Track expenses, set budgets, and achieve your financial goals with powerful analytics
          </p>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            A modern, intuitive finance planner designed to help you understand your spending and save more money
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-2xl shadow-violet-600/50"
              size="lg"
            >
              <Link to="/categories" className="flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="glass border-white/20 hover:border-white/40"
              size="lg"
            >
              <Link to="/api-test">Learn More</Link>
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400"></div>
              <span>Smart Insights</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Powerful features designed to make managing your finances effortless and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glass border-white/10 hover:border-violet-500/50 card-hover group animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8">
                <div className="mb-6 p-3 bg-gradient-to-br from-white/10 to-white/5 rounded-xl inline-block group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10"></div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Financial Future?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already taking control of their finances with our powerful platform
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-2xl shadow-violet-600/50"
              size="lg"
            >
              <Link to="/sign-up" className="flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
