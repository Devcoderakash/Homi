export type AdminUser = {
  id: number;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: "admin";
  city?: string | null;
  createdAt?: string;
  token?: string;
};

export type Customer = {
  id: number;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  role?: string;
  city?: string | null;
  address?: string | null;
  createdAt?: string;
  bookingCount?: number;
  totalSpent?: number;
  status?: "active" | "inactive" | "suspended" | "verified";
};

export type Worker = {
  id: number;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  role?: string;
  city?: string | null;
  specialty?: string | null;
  bio?: string | null;
  spokenLanguages?: string;
  experienceYears?: number;
  visitFee?: number; // in paise
  available: boolean;
  serviceRadiusKm?: number;
  rating?: number | null;
  reviewCount?: number;
  completedJobs?: number;
  earnings?: number;
  approvalStatus?: "approved" | "pending" | "rejected";
  createdAt?: string;
};

export type ServiceCategory = {
  id: string | number;
  name: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  iconName?: string;
  icon?: string;
  color?: string;
  startingPrice?: number;
  active: boolean;
  requestCount?: number;
};

export type Booking = {
  id: number;
  customerId?: number;
  workerId?: number | null;
  requestedWorkerId?: number | null;
  category: string;
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
  preferredDate?: string;
  preferredTime?: string;
  status:
    | "open"
    | "accepted"
    | "on_the_way"
    | "in_progress"
    | "awaiting_confirmation"
    | "completed"
    | "cancelled"
    | string;
  quotedAmount?: number | null; // in paise
  quoteNote?: string | null;
  quoteStatus?: "none" | "pending" | "approved" | string;
  visitStartsAt?: string | null;
  proposedVisitAt?: string | null;
  visitStatus?: "none" | "pending" | "confirmed" | string;
  paymentStatus: "unpaid" | "reported" | "received" | string;
  paymentMethod?: "cash" | "upi" | null | string;
  paidAt?: string | null;
  customerName?: string;
  customerPhone?: string;
  workerName?: string | null;
  workerPhone?: string | null;
  createdAt: string;
  updatedAt?: string;
  photoCount?: number;
  isDemo?: boolean;
};

export type Assignment = {
  id: number;
  bookingId: number;
  workerId: number;
  workerName: string;
  workerSpecialty?: string;
  customerName: string;
  category: string;
  status: "assigned" | "claimed" | "released" | "on_the_way" | "in_progress" | "completed" | string;
  assignedAt: string;
  completedAt?: string | null;
  distanceKm?: number | null;
};

export type Quotation = {
  id: number;
  bookingId: number;
  workerId?: number;
  workerName: string;
  customerName: string;
  amount?: number; // in paise
  amountPaise?: number;
  note?: string | null;
  notes?: string | null;
  status: "pending" | "approved" | "accepted" | "declined" | "rejected" | "expired" | string;
  createdAt: string;
  updatedAt?: string;
};

export type Appointment = {
  id: number;
  bookingId: number;
  customerName: string;
  workerName: string;
  category?: string;
  startsAt?: string; // ISO date string in IST
  scheduledTime?: string;
  slot?: string;
  durationMinutes?: number;
  status: "confirmed" | "scheduled" | "pending" | "in_progress" | "completed" | "cancelled" | string;
  address: string;
  city?: string;
};

export type PaymentRecord = {
  id: number;
  bookingId: number;
  customerName: string;
  workerName: string;
  amount: number; // in paise
  method: "cash" | "upi";
  status: "reported" | "received" | "unpaid" | "disputed";
  reportedAt: string;
  acknowledgedAt: string | null;
};

export type Review = {
  id: number;
  requestId?: number;
  bookingId?: number;
  customerId?: number;
  workerId?: number;
  customerName?: string;
  workerName?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  moderated?: boolean;
};

export type AuditLog = {
  id: string;
  adminEmail: string;
  action: string;
  entityType?: "worker" | "customer" | "booking" | "service" | "payment" | "review" | "auth" | "settings" | string;
  entity?: string;
  entityId?: string;
  timestamp?: string;
  createdAt?: string;
  ipAddress: string;
  details: string;
};

export type SystemNotification = {
  id: number | string;
  title: string;
  body?: string;
  message?: string;
  type: "booking" | "worker" | "payment" | "security" | "system" | "warning" | "error" | "success" | "info" | string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
};

export type DashboardKpis = {
  totalCustomers: number;
  totalWorkers: number;
  activeWorkers: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenuePaise: number;
  totalRevenueRupees: number;
  totalReviews: number;
  avgRating: number;
};
