'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Repeat,
  X
} from 'lucide-react'
import type { Transaction, Budget, SavingsGoal, FinancialSummary } from '@/lib/types'

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 
  'Health', 'Education', 'Rent', 'Utilities', 'Subscriptions', 'Other'
]

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other']

export default function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  
  // Form states
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    color: '#6172f3'
  })

  const [budgetForm, setBudgetForm] = useState({
    category: 'Food',
    amount: ''
  })

  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50)
      
      if (txns) setTransactions(txns)

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', monthStart)
      
      if (budgetData) setBudgets(budgetData)

      const { data: goalsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      if (goalsData) setSavingsGoals(goalsData)

      const monthTxns = txns?.filter(t => t.date >= monthStart) || []
      const totalIncome = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      
      const expenseByCategory: Record<string, number> = {}
      monthTxns.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
      })

      const budgetStatus = (budgetData || []).map(b => ({
        category: b.category,
        budget: b.amount,
        spent: expenseByCategory[b.category] || 0,
        remaining: b.amount - (expenseByCategory[b.category] || 0),
        percentage: Math.round(((expenseByCategory[b.category] || 0) / b.amount) * 100)
      }))

      setSummary({
        month: monthStart,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_savings: totalIncome - totalExpenses,
        expense_by_category: expenseByCategory,
        income_by_category: {},
        budget_status: budgetStatus,
        transaction_count: monthTxns.length
      })
    } catch (err) {
      console.error('Failed to load finances data:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTransaction = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !transactionForm.amount) return

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: parseFloat(transactionForm.amount),
      type: transactionForm.type,
      category: transactionForm.category,
      description: transactionForm.description || null,
      date: transactionForm.date
    })

    if (!error) {
      setShowAddTransaction(false)
      setTransactionForm({
        amount: '',
        type: 'expense',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      fetchData()
    }
  }

  const addSavingsGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !goalForm.name || !goalForm.target_amount) return

    const { error } = await supabase.from('savings_goals').insert({
      user_id: user.id,
      name: goalForm.name,
      target_amount: parseFloat(goalForm.target_amount),
      deadline: goalForm.deadline || null,
      color: goalForm.color
    })

    if (!error) {
      setShowAddGoal(false)
      setGoalForm({ name: '', target_amount: '', deadline: '', color: '#6172f3' })
      fetchData()
    }
  }

  const addBudget = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !budgetForm.amount) return

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const { error } = await supabase.from('budgets').upsert({
      user_id: user.id,
      category: budgetForm.category,
      amount: parseFloat(budgetForm.amount),
      month: monthStart
    }, { onConflict: 'user_id,category,month' })

    if (!error) {
      setShowAddBudget(false)
      setBudgetForm({ category: 'Food', amount: '' })
      fetchData()
    }
  }

  const deleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    fetchData()
  }

  const updateGoalAmount = async (goalId: string, amount: number) => {
    await supabase.from('savings_goals').update({ current_amount: amount }).eq('id', goalId)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="animate-slide-up card p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
              <DollarSign className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">/ Finances</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Finances</h1>
              <p className="text-sm text-slate-500 mt-1">Track your income, expenses, and savings</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">Income</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            ${summary?.total_income.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <p className="text-xs text-slate-400 mt-1">This month</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">Expenses</span>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            ${summary?.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <p className="text-xs text-slate-400 mt-1">This month</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">Net Savings</span>
            <PiggyBank className="h-5 w-5 text-slate-500" />
          </div>
          <p className={`text-2xl font-bold mt-2 ${(summary?.net_savings || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${Math.abs(summary?.net_savings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">{(summary?.net_savings || 0) >= 0 ? 'Saved' : 'Over budget'}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">Transactions</span>
            <Repeat className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {summary?.transaction_count || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">This month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions yet</p>
            ) : (
              transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {t.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{t.description || t.category}</p>
                      <p className="text-xs text-slate-400">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => deleteTransaction(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                    >
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Budget & Goals */}
        <div className="space-y-6">
          {/* Budget Progress */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Budgets</h2>
              <button 
                onClick={() => setShowAddBudget(true)}
                className="text-sky-600 hover:text-sky-700 text-sm font-medium"
              >
                + Add
              </button>
            </div>
            <div className="space-y-4">
              {summary?.budget_status.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No budgets set</p>
              ) : (
                summary?.budget_status.map((b) => (
                  <div key={b.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{b.category}</span>
                      <span className={b.percentage > 100 ? 'text-red-600' : 'text-slate-500'}>
                        ${b.spent.toFixed(0)} / ${b.budget.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          b.percentage > 100 ? 'bg-red-500' : b.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Savings Goals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Savings Goals</h2>
              <button 
                onClick={() => setShowAddGoal(true)}
                className="text-sky-600 hover:text-sky-700 text-sm font-medium"
              >
                + Add
              </button>
            </div>
            <div className="space-y-4">
              {savingsGoals.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No savings goals</p>
              ) : (
                savingsGoals.map((goal) => (
                  <div key={goal.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4" style={{ color: goal.color }} />
                      <span className="font-medium text-slate-900">{goal.name}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">
                        ${goal.current_amount.toFixed(0)} of ${goal.target_amount.toFixed(0)}
                      </span>
                      <span className="text-slate-400">
                        {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%`,
                          backgroundColor: goal.color
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Transaction</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTransactionForm(f => ({ ...f, type: 'expense', category: 'Food' }))}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    transactionForm.type === 'expense' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setTransactionForm(f => ({ ...f, type: 'income', category: 'Salary' }))}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    transactionForm.type === 'income' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {(transactionForm.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="What was this for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddTransaction(false)}
                  className="flex-1 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTransaction}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Savings Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g., Emergency Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Target Amount ($)</label>
                <input
                  type="number"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm(f => ({ ...f, target_amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Target Date (optional)</label>
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addSavingsGoal}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Set Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddBudget(false)}
                  className="flex-1 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addBudget}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
                >
                  Set Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
