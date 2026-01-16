import { Button } from '@/components/ui/button';

interface ExpenseEmptyStateProps {
  onCreateClick: () => void;
}

export default function ExpenseEmptyState({ onCreateClick }: ExpenseEmptyStateProps) {
  return (
    <div className="glass border border-white/10 rounded-2xl p-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">💰</span>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">No Expenses Yet</h3>
      <p className="text-slate-400 mb-6">Start tracking your expenses by adding your first one</p>
      <Button
        onClick={onCreateClick}
        variant="gradient"
        size="lg"
      >
        + Add Expense
      </Button>
    </div>
  );
}
