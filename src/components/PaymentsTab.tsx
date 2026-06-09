"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, ReceiptText, Sparkles, X } from "lucide-react";
import {
  cancelSubscription,
  getInvoicePreview,
  getInvoices,
  getPaymentHistory,
  getPaymentSummary,
  type PaymentInvoice,
  type PaymentSummary,
  type PaymentTransaction,
} from "@/services/payment.service";
import { showError, showSuccess } from "@/components/toastUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BILLING_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString();
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getBillingCycleLabel(cycle?: string) {
  if (cycle === "annual") return "Annual";
  if (cycle === "one_time") return "One-time";
  return "Monthly";
}

function getScopeLabel(scope?: string) {
  return scope === "team" ? "Team" : "Personal";
}

function getTransactionPaymentDate(transaction: PaymentTransaction) {
  const sourceDate = transaction.completedAt || transaction.createdAt;
  const parsedDate = new Date(sourceDate || 0);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getBillingCycleExpiry(transaction: PaymentTransaction) {
  const paymentDate = getTransactionPaymentDate(transaction);
  if (!paymentDate) {
    return null;
  }

  return new Date(paymentDate.getTime() + BILLING_CYCLE_MS);
}

function isTransactionActive(transaction: PaymentTransaction, now = new Date()) {
  if ((transaction.status || "").toLowerCase() !== "completed") {
    return false;
  }

  const expiryDate = getBillingCycleExpiry(transaction);
  return Boolean(expiryDate && now < expiryDate);
}

function getActiveTransactionIds(transactions: PaymentTransaction[]) {
  const groupedTransactions = new Map<string, PaymentTransaction[]>();

  for (const transaction of transactions) {
    const groupKey = transaction.scope === "team"
      ? `team:${transaction.teamId || transaction.teamName || transaction.id}`
      : "personal";

    const existing = groupedTransactions.get(groupKey) || [];
    existing.push(transaction);
    groupedTransactions.set(groupKey, existing);
  }

  const activeIds = new Set<string>();

  for (const group of groupedTransactions.values()) {
    const latestActive = group
      .filter((transaction) => isTransactionActive(transaction))
      .slice()
      .sort((left, right) => {
        const leftTime = getTransactionPaymentDate(left)?.getTime() || 0;
        const rightTime = getTransactionPaymentDate(right)?.getTime() || 0;
        return rightTime - leftTime;
      })[0];

    if (latestActive) {
      activeIds.add(latestActive.id);
    }
  }

  return activeIds;
}

interface CancelDialogState {
  open: boolean;
  subscriptionId: string | null;
  packageName: string | null;
  loading: boolean;
  creditExpiresAt: string | null;
}

export function PaymentsTab() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceDateFrom, setInvoiceDateFrom] = useState("");
  const [invoiceDateTo, setInvoiceDateTo] = useState("");
  const [invoiceMinAmount, setInvoiceMinAmount] = useState<number | "">();
  const [invoiceMaxAmount, setInvoiceMaxAmount] = useState<number | "">();
  const [invoicePlanFor, setInvoicePlanFor] = useState<string>("all");
  const [invoiceAutoRenewFilter, setInvoiceAutoRenewFilter] = useState<string>("all");
  const [invoiceSearchLoading, setInvoiceSearchLoading] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<CancelDialogState>({
    open: false,
    subscriptionId: null,
    packageName: null,
    loading: false,
    creditExpiresAt: null,
  });
  const activeSubscriptionIds = useMemo(() => getActiveTransactionIds(transactions), [transactions]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [summaryData, historyData, invoiceData] = await Promise.all([
          getPaymentSummary(),
          getPaymentHistory(),
          getInvoices({ limit: 100 }),
        ]);

        setSummary(summaryData);
        setTransactions(historyData.transactions || []);
        setInvoices(invoiceData.invoices || []);
      } catch (error: any) {
        showError(error?.message || "Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    invoices.forEach((invoice) => {
      if (!invoice.issueDate) return;
      const date = new Date(invoice.issueDate);
      if (!Number.isNaN(date.getTime())) {
        keys.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
      }
    });
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let list = invoices.slice();

    if (selectedMonth !== "all") {
      list = list.filter((invoice) => {
        if (!invoice.issueDate) return false;
        const date = new Date(invoice.issueDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return key === selectedMonth;
      });
    }

    if (invoicePlanFor !== "all") {
      list = list.filter((invoice) => (invoice.planFor || invoice.scope || "personal") === invoicePlanFor);
    }

    if (invoiceAutoRenewFilter === "enabled") {
      list = list.filter((invoice) => !!invoice.autoRenewal);
    } else if (invoiceAutoRenewFilter === "disabled") {
      list = list.filter((invoice) => !invoice.autoRenewal);
    }

    return list;
  }, [invoices, selectedMonth, invoicePlanFor, invoiceAutoRenewFilter]);

  const downloadInvoicePdf = async (invoice: PaymentInvoice) => {
    try {
      setDownloadingInvoiceId(invoice.subscriptionId);
      const directUrl = invoice.stripeInvoicePdfUrl || invoice.stripeInvoiceHostedUrl;
      if (directUrl) {
        window.open(directUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const preview = await getInvoicePreview(invoice.subscriptionId);
      const blob = new Blob([preview.html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      showError(error?.message || "Failed to download invoice PDF");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleInvoiceSearch = async () => {
    try {
      setInvoiceSearchLoading(true);
      const invoiceData = await getInvoices({
        limit: 100,
        search: invoiceSearch || undefined,
        dateFrom: invoiceDateFrom || undefined,
        dateTo: invoiceDateTo || undefined,
        minAmount: invoiceMinAmount !== "" && invoiceMinAmount !== undefined ? Number(invoiceMinAmount) : undefined,
        maxAmount: invoiceMaxAmount !== "" && invoiceMaxAmount !== undefined ? Number(invoiceMaxAmount) : undefined,
      });
      setInvoices(invoiceData.invoices || []);
    } catch (error: any) {
      showError(error?.message || "Failed to search invoices");
    } finally {
      setInvoiceSearchLoading(false);
    }
  };

  const clearInvoiceFilters = async () => {
    setInvoiceSearch("");
    setInvoiceDateFrom("");
    setInvoiceDateTo("");
    setInvoiceMinAmount(undefined);
    setInvoiceMaxAmount(undefined);
    setSelectedMonth("all");
    setInvoicePlanFor("all");
    setInvoiceAutoRenewFilter("all");

    try {
      const invoiceData = await getInvoices({ limit: 100 });
      setInvoices(invoiceData.invoices || []);
    } catch (error: any) {
      showError(error?.message || "Failed to load invoices");
    }
  };

  const handleCancelSubscription = async () => {
    const { subscriptionId } = cancelDialog;
    if (!subscriptionId) return;

    try {
      setCancelDialog((previous) => ({ ...previous, loading: true }));
      await cancelSubscription(subscriptionId);
      showSuccess("Subscription cancelled successfully");

      const [historyData, summaryData] = await Promise.all([getPaymentHistory(), getPaymentSummary()]);
      setTransactions(historyData.transactions || []);
      setSummary(summaryData);
      setCancelDialog({ open: false, subscriptionId: null, packageName: null, loading: false, creditExpiresAt: null });
    } catch (error: any) {
      const message = error?.message || "Failed to cancel subscription";
      if (message.toLowerCase().includes("already cancelled")) {
        showSuccess("Subscription was already cancelled");
        try {
          const [historyData, summaryData] = await Promise.all([getPaymentHistory(), getPaymentSummary()]);
          setTransactions(historyData.transactions || []);
          setSummary(summaryData);
        } catch (reloadError) {
          console.error("Failed to reload after cancellation:", reloadError);
        }
        setCancelDialog({ open: false, subscriptionId: null, packageName: null, loading: false, creditExpiresAt: null });
      } else {
        showError(message);
      }
    } finally {
      setCancelDialog((previous) => ({ ...previous, loading: false }));
    }
  };

  const openCancelDialog = (transaction: PaymentTransaction) => {
    const creditExpiresAt = getBillingCycleExpiry(transaction);

    if (!activeSubscriptionIds.has(transaction.id)) {
      showError("Only the active subscription row can be cancelled here");
      return;
    }

    if (!creditExpiresAt) {
      showError("Unable to calculate the billing cycle expiry for this subscription");
      return;
    }

    setCancelDialog({
      open: true,
      subscriptionId: transaction.id,
      packageName: transaction.packageName,
      loading: false,
      creditExpiresAt: creditExpiresAt.toISOString(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Total Spent</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary?.summary.totalSpent || 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.summary.totalPurchases || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.breakdown.active || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Total Renewals</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.summary.totalRenewals || 0}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <div className="mt-4 rounded-xl border border-indigo-100 bg-linear-to-r from-indigo-50 via-white to-sky-50 px-4 py-3 text-sm text-slate-700">
          <div className="flex items-center gap-2 font-medium text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Unified billing view
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Includes personal plans, monthly or annual billing, team purchases, and extra seat transactions.
          </p>
        </div>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Auto Renewal</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-slate-500">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                            <div className="flex items-center gap-2 font-medium text-slate-900">
                              <span>{transaction.packageName || "-"}</span>
                              {activeSubscriptionIds.has(transaction.id) ? (
                                <Badge className="border-transparent bg-emerald-50 text-emerald-800 hover:bg-emerald-50">Active</Badge>
                              ) : null}
                            </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <span>{getScopeLabel(transaction.scope)}</span>
                            {transaction.teamName ? <span>• {transaction.teamName}</span> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {transaction.seatCapacityLabel || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getBillingCycleLabel(transaction.billingCycle)}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.credits || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                            {transaction.status === "in_process"
                              ? "In Process"
                              : (transaction.status || "").toString().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.autoRenewal ? "default" : "outline"}>
                            {transaction.autoRenewal ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(transaction.completedAt || transaction.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {activeSubscriptionIds.has(transaction.id) && transaction.scope !== "team" && transaction.autoRenewal && !transaction.cancelledAt ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => openCancelDialog(transaction)}
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <CardTitle>Invoice & Transaction Receipts</CardTitle>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
                      <input
                        type="text"
                        placeholder="Invoice #, package, team"
                        value={invoiceSearch}
                        onChange={(event) => setInvoiceSearch(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && handleInvoiceSearch()}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">From Date</label>
                      <input
                        type="date"
                        value={invoiceDateFrom}
                        onChange={(event) => setInvoiceDateFrom(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">To Date</label>
                      <input
                        type="date"
                        value={invoiceDateTo}
                        onChange={(event) => setInvoiceDateTo(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Min Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={invoiceMinAmount ?? ""}
                        onChange={(event) => setInvoiceMinAmount(event.target.value ? parseFloat(event.target.value) : undefined)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Max Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="999.99"
                        value={invoiceMaxAmount ?? ""}
                        onChange={(event) => setInvoiceMaxAmount(event.target.value ? parseFloat(event.target.value) : undefined)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Month</label>
                      <select
                        value={selectedMonth}
                        onChange={(event) => setSelectedMonth(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="all">All months</option>
                        {monthOptions.map((month) => (
                          <option key={month} value={month}>
                            {monthLabel(month)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Plan For</label>
                      <select
                        value={invoicePlanFor}
                        onChange={(event) => setInvoicePlanFor(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="all">All</option>
                        <option value="personal">Personal</option>
                        <option value="team">Team</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Auto Renewal</label>
                      <select
                        value={invoiceAutoRenewFilter}
                        onChange={(event) => setInvoiceAutoRenewFilter(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="all">All</option>
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={handleInvoiceSearch} disabled={invoiceSearchLoading} className="bg-indigo-600 text-white hover:bg-indigo-700">
                      {invoiceSearchLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                    <Button onClick={clearInvoiceFilters} variant="outline" disabled={invoiceSearchLoading}>
                      Clear Filters
                    </Button>
                    <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200">{filteredInvoices.length} shown</span>
                      {invoicePlanFor !== "all" ? <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 ring-1 ring-indigo-100">Plan: {invoicePlanFor}</span> : null}
                      {invoiceAutoRenewFilter !== "all" ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-slate-200">Auto-renew: {invoiceAutoRenewFilter}</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Auto Renewal</TableHead>
                    <TableHead>Date Subscribed</TableHead>
                    <TableHead>Valid Till</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-slate-500">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const isDownloading = downloadingInvoiceId === invoice.subscriptionId;
                      const canDownloadPdf = invoice.previewAvailable !== false;

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{invoice.invoiceNumber}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{invoice.packageName}</div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <span>{getScopeLabel(invoice.planFor || invoice.scope)}</span>
                              {invoice.teamName ? <span>• {invoice.teamName}</span> : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {invoice.seatCapacityLabel || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getBillingCycleLabel(invoice.billingCycle)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={invoice.autoRenewal ? "default" : "outline"}>{invoice.autoRenewal ? "Enabled" : "Disabled"}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(invoice.dateSubscribed || invoice.issueDate)}</TableCell>
                          <TableCell>{formatDate(invoice.validTill || null)}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadInvoicePdf(invoice)}
                              disabled={isDownloading || !canDownloadPdf}
                            >
                              {isDownloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : !canDownloadPdf ? (
                                <ReceiptText className="mr-2 h-4 w-4" />
                              ) : (
                                <Download className="mr-2 h-4 w-4" />
                              )}
                              {canDownloadPdf ? "Download PDF" : "No PDF"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) =>
          setCancelDialog((previous) => ({
            ...previous,
            open,
            subscriptionId: open ? previous.subscriptionId : null,
            packageName: open ? previous.packageName : null,
            creditExpiresAt: open ? previous.creditExpiresAt : null,
          }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your {cancelDialog.packageName} subscription? You can resubscribe anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, subscriptionId: null, packageName: null, loading: false, creditExpiresAt: null })}
              disabled={cancelDialog.loading}
            >
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelDialog.loading}>
              {cancelDialog.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
