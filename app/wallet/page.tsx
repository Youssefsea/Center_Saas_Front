"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudentLayout } from "../components/student/student-layout";
import { PageTransition } from "../components/page-transition";
import { CountUp } from "../components/student/count-up";
import { ErrorToast } from "../components/error-toast";
import { EmptyState } from "../components/empty-state";
import { api, normalizeApiError } from "../lib/api";
import { formatRelativeDate } from "../lib/student-utils";
import { useWallet } from "../providers/wallet-provider";
import useModalKeyboard from "../hooks/useModalKeyboard";
import { DEFAULT_LIMIT, MAX_DEPOSIT_AMOUNT, MIN_DEPOSIT_AMOUNT } from "../../constants";

type Transaction = {
  id: string;
  type: "deposit" | "booking_charge" | "refund" | "transfer"  |"withdrawal";
  subject?: string | null;
  amount: number;
  createdAt: string;
  balanceSnapshot?: number | null;
};

const typeLabels: Record<string, string> = {
  deposit: "شحن محفظة",
  booking_charge: "حجز حصة",
  refund: "استرداد - إلغاء حصة",
  transfer: "تحويل",
  withdrawal: "سحب",
};

const typeIcons: Record<string, string> = {
  deposit: "⬆️",
  booking_charge: "📅",
  refund: "↩️",
  transfer: "🔄",
  withdrawal: "⬇️",
};

export default function WalletPage() {
  const { balance, refresh } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "deposit" | "booking_charge" | "refund" | "transfer" | "withdrawal">(
    "all"
  );
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("فودافون كاش");
  const [paymentReference, setPaymentReference] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const depositCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    fetchTransactions(0, true, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = useCallback(
    (nextOffset: number, reset?: boolean, signal?: AbortSignal) => {
    setLoading(true);
    api
      .get("/wallet/transactions", {
        params: { limit: DEFAULT_LIMIT, offset: nextOffset },
        signal,
      })
      .then((response) => {
        const items = response.data?.transactions ?? response.data ?? [];
        const mapped = items.map(mapTransaction);
        setTransactions((prev) => (reset ? mapped : [...prev, ...mapped]));
        setOffset(nextOffset + mapped.length);
        setHasMore(mapped.length === DEFAULT_LIMIT);
      })
      .catch((error) => {
        if (signal?.aborted) return;
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setLoading(false));
    },
    []
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((tx) => tx.type === filter);
  }, [filter, transactions]);

  const handleToastClose = useCallback(() => setToast(null), []);
  const handleDeposit = useCallback(() => {
    if (depositAmount === "" || Number(depositAmount) < MIN_DEPOSIT_AMOUNT) {
      setToast(`أقل مبلغ للشحن هو ${MIN_DEPOSIT_AMOUNT} جنيه`);
      return;
    }
    if (Number(depositAmount) > MAX_DEPOSIT_AMOUNT) {
      setToast(`أقصى مبلغ للشحن هو ${MAX_DEPOSIT_AMOUNT} جنيه`);
      return;
    }
    setDepositLoading(true);
    api
      .post("/wallet/deposit", {
        amount: Number(depositAmount),
        paymentMethod,
        paymentReference: paymentReference || undefined,
      })
      .then((response) => {
        const newBalance =
          response.data?.balance ??
          response.data?.walletBalance ??
          response.data?.data?.balance;
        refresh();
        setDepositOpen(false);
        setDepositAmount("");
        setPaymentReference("");
        setToast(
          `اتشحنت المحفظة بنجاح! رصيدك دلوقتي ${
            typeof newBalance === "number" ? newBalance : balance ?? 0
          } جنيه 🎉`
        );
        fetchTransactions(0, true);
      })
      .catch((error) => {
        const normalized = normalizeApiError(error);
        setToast(normalized.message);
      })
      .finally(() => setDepositLoading(false));
  }, [balance, depositAmount, fetchTransactions, paymentMethod, paymentReference, refresh]);

  const handleFilterChange = useCallback(
    (key: typeof filter) => setFilter(key),
    []
  );
  const handleOpenDeposit = useCallback(() => setDepositOpen(true), []);
  const handleCloseDeposit = useCallback(() => setDepositOpen(false), []);
  const handleLoadMore = useCallback(() => fetchTransactions(offset), [fetchTransactions, offset]);
  const handleDepositAmountChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDepositAmount(value === "" ? "" : Number(value));
  }, []);
  const handleQuickAmount = useCallback((amount: number) => setDepositAmount(amount), []);
  const handlePaymentMethodChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => setPaymentMethod(event.target.value),
    []
  );
  const handlePaymentReferenceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPaymentReference(event.target.value),
    []
  );

  useModalKeyboard(depositOpen, handleCloseDeposit, depositCloseRef);

  return (
    <StudentLayout>
      <PageTransition>
        {toast && <ErrorToast message={toast} onClose={handleToastClose} />}

        <section className="rounded-3xl bg-gradient-to-l from-primary to-primary/70 p-6 text-white">
          <p className="text-sm text-white/80">رصيدك الحالي</p>
          <h1 className="mt-2 text-3xl font-semibold">
            <CountUp value={balance ?? 0} /> جنيه
          </h1>
          {balance === 0 && (
            <p className="mt-2 text-xs text-white/70">
              محفظتك فاضية، شحنها وابدأ تحجز!
            </p>
          )}
            <button
              type="button"
              onClick={handleOpenDeposit}
              className="btn-ripple mt-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              شحن المحفظة
            </button>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">سجل المعاملات</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { key: "all", label: "الكل" },
                { key: "deposit", label: "شحن" },
                { key: "booking_charge", label: "حجز" },
                { key: "refund", label: "استرداد" },
                { key: "transfer", label: "تحويل" },
                { key: "withdrawal", label: "سحب" },
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleFilterChange(chip.key as typeof filter)}
                  className={`rounded-full px-3 py-1 ${
                    filter === chip.key
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading && transactions.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-muted">
                جارٍ تحميل المعاملات...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <EmptyState
                illustration="💰"
                title="مفيش معاملات لسه، شحن محفظتك وابدأ!"
                subtitle="هتلاقي هنا كل عمليات الشحن والحجز"
              />
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-card md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcons[tx.type]}</span>
                    <div>
                      <p className="text-sm font-semibold">
                        {typeLabels[tx.type]}{" "}
                        {tx.subject ? `- ${tx.subject}` : ""}
                      </p>
                      <p className="text-xs text-muted">
                        {formatRelativeDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    <span
                      className={
                        tx.type === "booking_charge" || tx.type === "transfer" || tx.type === "withdrawal"
                          ? "text-error"
                          : "text-success"
                      }
                    >
                      {tx.type === "booking_charge" || tx.type === "transfer" || tx.type === "withdrawal" ? "-" : "+"}
                      {Math.abs(tx.amount)} جنيه
                    </span>
                    {tx.balanceSnapshot !== null && tx.balanceSnapshot !== undefined && (
                      <p className="text-xs text-muted">
                        الرصيد: {tx.balanceSnapshot} جنيه
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              className="btn-ripple mt-6 w-full rounded-full border border-primary px-4 py-3 text-sm font-semibold text-primary"
            >
              تحميل المزيد
            </button>
          )}
        </section>

        {depositOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-card md:max-w-lg md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">شحن المحفظة</h3>
                <button
                  ref={depositCloseRef}
                  type="button"
                  onClick={handleCloseDeposit}
                  aria-label="إغلاق"
                  className="text-xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-muted">المبلغ</span>
                  <input
                    type="number"
                    min={MIN_DEPOSIT_AMOUNT}
                    max={MAX_DEPOSIT_AMOUNT}
                    value={depositAmount}
                    onChange={handleDepositAmountChange}
                    aria-label="المبلغ"
                    aria-required="true"
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickAmount(amount)}
                      aria-label={`شحن ${amount} جنيه`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                    >
                      {amount} جنيه
                    </button>
                  ))}
                </div>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-muted">طريقة الدفع</span>
                  <select
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    aria-label="طريقة الدفع"
                    aria-required="true"
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    {["فودافون كاش", "اتصالات كاش", "انستا باي", "بطاقة بنكية"].map(
                      (method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-muted">رقم العملية (اختياري)</span>
                  <input
                    value={paymentReference}
                    onChange={handlePaymentReferenceChange}
                    aria-label="رقم العملية"
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="رقم العملية"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDeposit}
                  disabled={depositLoading}
                  className="btn-ripple w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {depositLoading ? "جارٍ الشحن..." : "تأكيد الشحن"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </StudentLayout>
  );
}

function mapTransaction(item: any): Transaction {
  const rawType = item.type ?? item.transaction_type ?? "deposit";
  const typeValue = ["deposit", "booking_charge", "refund", "transfer", "withdrawal"].includes(rawType)
    ? rawType
    : "deposit";
  return {
    id: item.id ,
    type: typeValue,
    amount: item.amount ?? item.value ?? 0,
    createdAt: item.created_at ,
   description: item.description ?? "",
   reference_type: item.reference_type ?? "",
   reference_id: item.reference_id ?? "",
  };
}
