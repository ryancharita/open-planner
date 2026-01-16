import { SupabaseClient } from '@supabase/supabase-js'
import { getTotalMonthlyIncome } from './income.ts'
import { getTotalMonthlySpend, type MonthlyExpenseByCategory } from './expenses.ts'
import { getLoans, calculateMonthlyPayment, type Loan } from './loans.ts'

export interface Insight {
  type: 'overspending' | 'loan_acceleration' | 'month_over_month'
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  actionable?: boolean
  actionLabel?: string
  actionRoute?: string
}

/**
 * Detect overspending based on expenses vs income
 */
function detectOverspending(
  income: number,
  expenses: number,
  loanObligations: number
): Insight | null {
  const totalObligations = expenses + loanObligations
  const remainingBalance = income - totalObligations

  // Critical: Spending exceeds income
  if (remainingBalance < 0) {
    return {
      type: 'overspending',
      title: '⚠️ Overspending Detected',
      message: `Your expenses and loan obligations (${formatCurrency(totalObligations)}) exceed your income (${formatCurrency(income)}) by ${formatCurrency(Math.abs(remainingBalance))}. Consider reducing expenses.`,
      severity: 'error',
      actionable: true,
      actionLabel: 'Review Expenses',
      actionRoute: '/expenses',
    }
  }

  // Warning: Spending more than 90% of income
  if (income > 0 && totalObligations / income > 0.9) {
    return {
      type: 'overspending',
      title: '💡 High Spending Alert',
      message: `You're spending ${((totalObligations / income) * 100).toFixed(0)}% of your income. Consider building a buffer by reducing expenses.`,
      severity: 'warning',
      actionable: true,
      actionLabel: 'Review Expenses',
      actionRoute: '/expenses',
    }
  }

  // Info: Spending 70-90% of income
  if (income > 0 && totalObligations / income > 0.7 && totalObligations / income <= 0.9) {
    return {
      type: 'overspending',
      title: '📊 Spending Review',
      message: `You're spending ${((totalObligations / income) * 100).toFixed(0)}% of your income. Good job staying within budget!`,
      severity: 'info',
    }
  }

  return null
}

/**
 * Suggest loan acceleration if there's available money
 */
function suggestLoanAcceleration(
  remainingBalance: number,
  loans: Loan[]
): Insight | null {
  // Only suggest if there's positive remaining balance and active loans exist
  if (remainingBalance <= 0) {
    return null
  }

  const activeLoans = loans.filter(loan => {
    const startDate = new Date(loan.start_date)
    const now = new Date()
    const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 +
                             (now.getMonth() - startDate.getMonth())
    return monthsSinceStart < loan.term_months
  })

  if (activeLoans.length === 0) {
    return null
  }

  // Find the loan with highest interest rate
  const highestInterestLoan = activeLoans.reduce((prev, current) =>
    current.interest_rate > prev.interest_rate ? current : prev
  )

  const monthlyPayment = calculateMonthlyPayment(
    highestInterestLoan.principal,
    highestInterestLoan.interest_rate,
    highestInterestLoan.term_months
  )

  // Suggest if remaining balance is at least 1.5x the monthly payment
  if (remainingBalance >= monthlyPayment * 1.5) {
    const extraPayment = Math.floor(remainingBalance / monthlyPayment) * monthlyPayment * 0.5

    return {
      type: 'loan_acceleration',
      title: '🚀 Loan Acceleration Opportunity',
      message: `You have ${formatCurrency(remainingBalance)} remaining. Consider making an extra payment of ${formatCurrency(extraPayment)} on your loan with ${(highestInterestLoan.interest_rate * 100).toFixed(2)}% interest to save on interest.`,
      severity: 'success',
      actionable: true,
      actionLabel: 'View Loans',
      actionRoute: '/loans',
    }
  }

  return null
}

/**
 * Compare month-over-month data
 */
function compareMonthOverMonth(
  currentIncome: number,
  currentExpenses: number,
  previousIncome: number,
  previousExpenses: number
): Insight | null {
  // Need at least previous month data to compare
  if (previousIncome === 0 && previousExpenses === 0) {
    return null
  }

  const incomeChange = previousIncome > 0
    ? ((currentIncome - previousIncome) / previousIncome) * 100
    : 0
  const expenseChange = previousExpenses > 0
    ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
    : 0

  // Significant changes
  if (Math.abs(incomeChange) > 10 || Math.abs(expenseChange) > 10) {
    const messages: string[] = []

    if (Math.abs(incomeChange) > 10) {
      const direction = incomeChange > 0 ? 'increased' : 'decreased'
      messages.push(`Income ${direction} by ${Math.abs(incomeChange).toFixed(0)}%`)
    }

    if (Math.abs(expenseChange) > 10) {
      const direction = expenseChange > 0 ? 'increased' : 'decreased'
      messages.push(`Expenses ${direction} by ${Math.abs(expenseChange).toFixed(0)}%`)
    }

    const severity = (incomeChange < -10 || expenseChange > 10) ? 'warning' : 'info'

    return {
      type: 'month_over_month',
      title: '📈 Month-over-Month Change',
      message: `Compared to last month: ${messages.join(', ')}.`,
      severity,
    }
  }

  return null
}

/**
 * Format currency for messages
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get all insights for a user for a specific month
 */
export async function getInsights(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  year: number,
  month: number
): Promise<Insight[]> {
  const insights: Insight[] = []

  // Get current month data
  const [currentIncome, currentExpenses, loans] = await Promise.all([
    getTotalMonthlyIncome(supabaseService, clerkUserId, year, month),
    getTotalMonthlySpend(supabaseService, clerkUserId, year, month),
    getLoans(supabaseService, clerkUserId),
  ])

  // Calculate loan obligations
  const loanObligations = loans.reduce((total, loan) => {
    const startDate = new Date(loan.start_date)
    const now = new Date()
    const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 +
                             (now.getMonth() - startDate.getMonth())

    if (monthsSinceStart < loan.term_months) {
      const monthlyPayment = calculateMonthlyPayment(
        loan.principal,
        loan.interest_rate,
        loan.term_months
      )
      return total + monthlyPayment
    }

    return total
  }, 0)

  const remainingBalance = currentIncome - currentExpenses - loanObligations

  // Get previous month data for comparison
  let previousIncome = 0
  let previousExpenses = 0

  try {
    let prevYear = year
    let prevMonth = month - 1

    if (prevMonth < 1) {
      prevMonth = 12
      prevYear = year - 1
    }

    const [prevInc, prevExp] = await Promise.all([
      getTotalMonthlyIncome(supabaseService, clerkUserId, prevYear, prevMonth).catch(() => 0),
      getTotalMonthlySpend(supabaseService, clerkUserId, prevYear, prevMonth).catch(() => 0),
    ])

    previousIncome = prevInc
    previousExpenses = prevExp
  } catch (error) {
    // If previous month data is not available, continue without comparison
    console.error('Error fetching previous month data:', error)
  }

  // Generate insights
  const overspendingInsight = detectOverspending(currentIncome, currentExpenses, loanObligations)
  if (overspendingInsight) {
    insights.push(overspendingInsight)
  }

  const loanAccelerationInsight = suggestLoanAcceleration(remainingBalance, loans)
  if (loanAccelerationInsight) {
    insights.push(loanAccelerationInsight)
  }

  const monthOverMonthInsight = compareMonthOverMonth(
    currentIncome,
    currentExpenses,
    previousIncome,
    previousExpenses
  )
  if (monthOverMonthInsight) {
    insights.push(monthOverMonthInsight)
  }

  return insights
}
