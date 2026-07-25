'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showError } from '@/components/toastUtils';

export type LogType = 'requests' | 'payments' | 'multi-image';

interface Props {
  type: LogType;
  apiUrl: string;
  token?: string;
  defaultMonth?: string;
  defaultSearch?: string;
  months?: string[];
}

const STATUS_OPTIONS: Record<Exclude<LogType, 'requests'>, string[]> = {
  payments: ['completed', 'failed', 'pending'],
  'multi-image': ['completed', 'partial', 'failed'],
};

const METHOD_OPTIONS = ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'];

const ALL_VALUE = '__all__';

export default function LogExportDialog({
  type,
  apiUrl,
  token,
  defaultMonth,
  defaultSearch,
  months,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [email, setEmail] = useState(defaultSearch || '');
  const [status, setStatus] = useState<string>(ALL_VALUE);
  const [method, setMethod] = useState<string>(ALL_VALUE);
  const [month, setMonth] = useState<string>(defaultMonth || ALL_VALUE);

  const emailLabel =
    type === 'requests'
      ? 'Search (email, name, IP, path, location)'
      : 'User email';

  const handleExport = async () => {
    if (!token) {
      showError('Not authenticated');
      return;
    }
    setBusy(true);
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (month && month !== ALL_VALUE) params.set('month', month);
      if (startDate) {
        // Parse the yyyy-mm-dd string in LOCAL time (raw `new Date("yyyy-mm-dd")`
        // parses as UTC midnight, which shifts the day west of UTC).
        const [y, m, d] = startDate.split('-').map(Number);
        params.set('startDate', new Date(y, m - 1, d, 0, 0, 0, 0).toISOString());
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        params.set('endDate', new Date(y, m - 1, d, 23, 59, 59, 999).toISOString());
      }
      if (email.trim()) params.set('email', email.trim());
      if (status && status !== ALL_VALUE) params.set('status', status);
      if (type === 'requests' && method && method !== ALL_VALUE) {
        params.set('method', method);
      }

      const res = await fetch(`${apiUrl}/admin/logs/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        showError(text || `Export failed (${res.status})`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setEmail('');
    setStatus(ALL_VALUE);
    setMethod(ALL_VALUE);
    setMonth(ALL_VALUE);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-cream-200 gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export {type.replace('-', ' ')} logs</DialogTitle>
          <DialogDescription>
            Leave filters empty to export everything shown on this page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {months && months.length > 0 && (
            <div className="space-y-1.5">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All months</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{emailLabel}</Label>
            <Input
              id="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {type === 'requests' && (
            <div className="space-y-1.5">
              <Label>HTTP method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All methods</SelectItem>
                  {METHOD_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === 'payments' || type === 'multi-image') && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
                  {STATUS_OPTIONS[type].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleReset} disabled={busy}>
            Reset filters
          </Button>
          <Button
            onClick={handleExport}
            disabled={busy}
            className="bg-brand-500 text-white hover:bg-[#002a66]"
          >
            {busy ? 'Exporting…' : 'Export CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
