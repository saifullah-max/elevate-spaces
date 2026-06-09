'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAuthFromStorage, clearAuthFromStorage } from '@/lib/auth.storage';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:3003';

interface LogStats {
  totalRequests: number;
  totalPayments: number;
  totalMultiImageRuns: number;
}

interface RequestLog {
  _id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  location?: string;
  ip?: string;
  responseTime?: number;
  error?: string;
}

interface PaymentLog {
  _id: string;
  timestamp: string;
  transactionId: string;
  userId: string;
  userEmail?: string;
  amount: number;
  currency: string;
  credits: number;
  status: string;
  emailSent: boolean;
  emailError?: string;
  metadata?: any;
}

interface MultiImageLog {
  _id: string;
  timestamp: string;
  runId: string;
  userId: string;
  userEmail?: string;
  totalImages: number;
  expectedVariants: number;
  completedVariants: number;
  failedVariants: number;
  status: string;
  elapsedSeconds: number;
  quotaExhausted: boolean;
}

export default function AdminLogsPage() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [multiImageLogs, setMultiImageLogs] = useState<MultiImageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [requestSearch, setRequestSearch] = useState('');

  const auth = getAuthFromStorage();
  const headers = {
    'Authorization': `Bearer ${auth?.token}`,
    'Content-Type': 'application/json',
  };
  console.log('[Admin Logs] Auth headers:', { token: auth?.token ? 'Present' : 'Missing', tokenLength: auth?.token?.length || 0, auth });
  const router = useRouter();

  // Helper to safely parse responses (handles non-JSON like HTML Unauthorized)
  const parseResponseSafely = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    const text = await res.text();
    return { success: false, error: text };
  };

  useEffect(() => {
    fetchMonths();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchStats();
    }
  }, [selectedMonth]);

  const fetchMonths = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/logs/months`, { headers });
      const data = await parseResponseSafely(res);
      console.log('[Admin Logs] fetchMonths response:', { status: res.status, data });
      if (res.status === 401) {
        clearAuthFromStorage();
        router.push('/sign-in');
        return;
      }
      if (data.success) {
        setMonths(data.data.months);
        if (data.data.months.length > 0 && !selectedMonth) {
          setSelectedMonth(data.data.months[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch months:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const url = selectedMonth
        ? `${API_URL}/admin/logs/stats?month=${selectedMonth}`
        : `${API_URL}/admin/logs/stats`;
      const res = await fetch(url, { headers });
      const data = await parseResponseSafely(res);
      console.log('[Admin Logs] fetchStats response:', { status: res.status, data, headers: Object.fromEntries(res.headers) });
      if (res.status === 401) {
        clearAuthFromStorage();
        router.push('/sign-in');
        return;
      }
      if (data && data.success) {
        setStats(data.data);
      } else if (data && data.error) {
        console.error('Failed to fetch stats:', data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRequestLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (selectedMonth) {
        params.set('month', selectedMonth);
      }
      if (requestSearch.trim()) {
        params.set('search', requestSearch.trim());
      }
      const url = `${API_URL}/admin/logs/requests?${params.toString()}`;
      const res = await fetch(url, { headers });
      const data = await parseResponseSafely(res);
      console.log('[Admin Logs] fetchRequestLogs response:', { status: res.status, data });
      if (res.status === 401) {
        clearAuthFromStorage();
        router.push('/sign-in');
        return;
      }
      if (data && data.success) {
        setRequestLogs(data.data.logs);
        setTotalPages(data.data.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch request logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestLogs()
  }, [selectedMonth])

  const handleRequestSearch = () => {
    setCurrentPage(1);
    fetchRequestLogs(1);
  };

  const handleClearRequestSearch = () => {
    setRequestSearch('');
    setCurrentPage(1);
    setTimeout(() => {
      fetchRequestLogs(1);
    }, 0);
  };

  const fetchPaymentLogs = async (page = 1) => {
    setLoading(true);
    try {
      const url = selectedMonth
        ? `${API_URL}/admin/logs/payments?month=${selectedMonth}&page=${page}&limit=20`
        : `${API_URL}/admin/logs/payments?page=${page}&limit=20`;
      const res = await fetch(url, { headers });
      const data = await parseResponseSafely(res);
      console.log('[Admin Logs] fetchPaymentLogs response:', { status: res.status, data });
      if (res.status === 401) {
        clearAuthFromStorage();
        router.push('/sign-in');
        return;
      }
      if (data && data.success) {
        setPaymentLogs(data.data.logs);
        setTotalPages(data.data.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch payment logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMultiImageLogs = async (page = 1) => {
    setLoading(true);
    try {
      const url = selectedMonth
        ? `${API_URL}/admin/logs/multi-image?month=${selectedMonth}&page=${page}&limit=20`
        : `${API_URL}/admin/logs/multi-image?page=${page}&limit=20`;
      const res = await fetch(url, { headers });
      const data = await parseResponseSafely(res);
      console.log('[Admin Logs] fetchMultiImageLogs response:', { status: res.status, data });
      if (res.status === 401) {
        clearAuthFromStorage();
        router.push('/sign-in');
        return;
      }
      if (data && data.success) {
        setMultiImageLogs(data.data.logs);
        setTotalPages(data.data.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch multi-image logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'completed': 'default',
      'partial': 'secondary',
      'failed': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'GET': 'outline',
      'POST': 'default',
      'PATCH': 'secondary',
      'DELETE': 'destructive',
    };
    return <Badge variant={colors[method] || 'outline'}>{method}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Analytics & Logs</h1>
            <p className="text-slate-600">MongoDB audit trail and platform analytics</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-600 font-medium">Total Requests</CardDescription>
              <CardTitle className="text-4xl font-bold text-slate-900">{stats.totalRequests.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">HTTP request logs</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-600 font-medium">Total Payments</CardDescription>
              <CardTitle className="text-4xl font-bold text-slate-900">{stats.totalPayments.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Payment transactions</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-600 font-medium">Multi-Image Runs</CardDescription>
              <CardTitle className="text-4xl font-bold text-slate-900">{stats.totalMultiImageRuns.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Batch staging operations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Section */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          <TabsTrigger
            value="requests"
            onClick={() => fetchRequestLogs()}
            className="data-[state=active]:bg-[#003580] data-[state=active]:text-white"
          >
            Requests
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            onClick={() => fetchPaymentLogs()}
            className="data-[state=active]:bg-[#003580] data-[state=active]:text-white"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="multi-image"
            onClick={() => fetchMultiImageLogs()}
            className="data-[state=active]:bg-[#003580] data-[state=active]:text-white"
          >
            Multi-Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="text-xl text-slate-900">Request Logs</CardTitle>
              <CardDescription>HTTP requests (POST, PATCH, DELETE, sensitive GETs)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">{loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : (
              <>
                <div className="border-b border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={requestSearch}
                      onChange={(event) => setRequestSearch(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleRequestSearch()}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003580]"
                      placeholder="Search name, email, location, IP, path"
                    />
                    <div className="flex gap-2 sm:shrink-0">
                      <Button onClick={handleRequestSearch} className="bg-[#003580] text-white hover:bg-[#002a66]">
                        Search
                      </Button>
                      <Button variant="outline" onClick={handleClearRequestSearch}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Time</TableHead>
                      <TableHead className="font-semibold text-slate-700">Method</TableHead>
                      <TableHead className="font-semibold text-slate-700">Path</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="font-semibold text-slate-700">Location</TableHead>
                      <TableHead className="font-semibold text-slate-700">Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>{getMethodBadge(log.method)}</TableCell>
                        <TableCell className="font-mono text-xs max-w-40 sm:max-w-xs truncate">
                          {log.path}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.statusCode < 400 ? 'default' : 'destructive'}>
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.userName || '-'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.userEmail || log.userId?.slice(0, 8) || '-'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.location || log.ip || '-'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.responseTime ? `${log.responseTime}ms` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
                  <Button
                    variant="outline"
                    onClick={() => fetchRequestLogs(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-slate-300"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchRequestLogs(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-slate-300"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="text-xl text-slate-900">Payment Logs</CardTitle>
              <CardDescription>Transaction history with email delivery status</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Time</TableHead>
                        <TableHead className="font-semibold text-slate-700">Transaction ID</TableHead>
                        <TableHead className="font-semibold text-slate-700">User</TableHead>
                        <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                        <TableHead className="font-semibold text-slate-700">Credits</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">Email Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {log.transactionId.slice(0, 12)}...
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {log.userEmail || log.userId.slice(0, 8)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            ${log.amount.toFixed(2)} {log.currency.toUpperCase()}
                          </TableCell>
                          <TableCell>{log.credits}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.emailSent ? (
                              <Badge variant="default">✓ Sent</Badge>
                            ) : (
                              <Badge variant="destructive">✗ Failed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                  <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
                    <Button
                      variant="outline"
                      onClick={() => fetchPaymentLogs(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-slate-300"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => fetchPaymentLogs(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-slate-300"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi-image" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="text-xl text-slate-900">Multi-Image Logs</CardTitle>
              <CardDescription>Batch processing run analytics</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Time</TableHead>
                        <TableHead className="font-semibold text-slate-700">Run ID</TableHead>
                        <TableHead className="font-semibold text-slate-700">User</TableHead>
                        <TableHead className="font-semibold text-slate-700">Images</TableHead>
                        <TableHead className="font-semibold text-slate-700">Completed/Expected</TableHead>
                        <TableHead className="font-semibold text-slate-700">Duration</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">Quota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {multiImageLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {log.runId.slice(0, 12)}...
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {log.userEmail || log.userId.slice(0, 8)}
                          </TableCell>
                          <TableCell>{log.totalImages}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {log.completedVariants}/{log.expectedVariants}
                            {log.failedVariants > 0 && (
                              <span className="text-red-500 text-xs ml-1">
                                ({log.failedVariants} failed)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{log.elapsedSeconds}s</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.quotaExhausted ? (
                              <Badge variant="destructive">Exhausted</Badge>
                            ) : (
                              <Badge variant="outline">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                  <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
                    <Button
                      variant="outline"
                      onClick={() => fetchMultiImageLogs(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-slate-300"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => fetchMultiImageLogs(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-slate-300"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
