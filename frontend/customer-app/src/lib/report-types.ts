export type WorkRecord = { id: number; title: string; category: string; status: string; quoteStatus: string; quotedAmount: number | null; paymentStatus: string; paymentMethod: string | null; paidAt: string | null; updatedAt: string; visitStartsAt: string | null; customerName: string; workerName: string | null; isDemo: boolean };
export type Overview = {
  role: string;
  totals: { requests: number; active: number; completed: number; agreedAmount: number; acknowledgedAmount: number; outstandingAmount: number; reportedAmount: number };
  months: { month: string; amount: number; jobs: number }[];
  visits: WorkRecord[];
  outstanding: WorkRecord[];
  recent: WorkRecord[];
};
export type ServiceReceipt = {
  number: string; id: number; title: string; description: string; category: string; city: string; address: string;
  customerName: string; workerName: string; amount: number; quoteNote: string | null;
  completedAt: string; visitStartsAt: string | null; paymentStatus: string; paymentMethod: string | null; paidAt: string | null; isDemo: boolean;
};
