import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';

const API_URL = 'http://localhost:5000';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Summary stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // Fetch all transactions
      const response = await fetch(`${API_URL}/api/payments/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      const txns = data.transactions || [];
      setTransactions(txns);

      // Calculate stats
      setStats({
        totalRevenue: txns
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        totalTransactions: txns.length,
        successfulPayments: txns.filter(t => t.status === 'completed').length,
        pendingPayments: txns.filter(t => t.status === 'pending').length,
        failedPayments: txns.filter(t => t.status === 'failed').length
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Export to CSV
    const csvContent = [
      ['Transaction ID', 'Date', 'Patient', 'Doctor', 'Amount', 'Status', 'Method'].join(','),
      ...filteredTransactions.map(t => [
        t._id,
        new Date(t.createdAt).toLocaleDateString(),
        t.patientName || t.patientId,
        t.doctorName || t.doctorId,
        t.amount,
        t.status,
        t.paymentMethod
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: { variant: 'default', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      pending: { variant: 'default', className: 'bg-amber-100 text-amber-700', icon: Clock },
      failed: { variant: 'default', className: 'bg-red-100 text-red-700', icon: XCircle },
      refunded: { variant: 'default', className: 'bg-blue-100 text-blue-700', icon: ArrowDownRight }
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon size={12} className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      (t.patientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t._id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      matchesDate = new Date(t.createdAt).toDateString() === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = new Date(t.createdAt) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = new Date(t.createdAt) >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500">
            Manage and monitor all payment transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={fetchTransactions} disabled={isLoading} variant="outline">
            Refresh
          </Button>
          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
            <Download size={18} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  LKR{stats.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.totalTransactions}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Successful</p>
                <h3 className="text-2xl font-bold text-emerald-600">{stats.successfulPayments}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <h3 className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by patient, doctor, or transaction ID..."
                className="pl-10 w-full block rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border-0 py-2 pl-3 pr-8 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-md border-0 py-2 pl-3 pr-8 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-red-600 bg-red-50 text-sm">
              <p>Error: {error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-900">Transaction ID</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-900">Patient</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-900">Doctor</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-900">Amount</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-900">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {paginatedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                          {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                            ? "No transactions matching your filters." 
                            : "No transactions found."}
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((txn) => (
                        <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                            #{txn._id?.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {new Date(txn.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">{txn.patientName || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">{txn.doctorName || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            ${txn.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(txn.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                            {txn.paymentMethod || 'Card'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                  <div className="text-sm text-slate-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
