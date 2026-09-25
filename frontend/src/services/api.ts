const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';


export interface QazaTotal {
  total_qazas: number;
}

export interface QazaBreakdown {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerStats {
  completed_today: number;
  daily_goal: number;
  cleared_this_week: number;
  total_prayers_logged: number;
  current_streak: number;
}

export interface WeeklyActivity {
  day: string;
  active: boolean;
}

export interface MonthSummary {
  ada_prayers: number;
  missed: number;
  qaza_done: number;
  most_missed_prayer: string;
  most_common_reason: string;
}

export interface UserInfo {
  name: string;
}

export interface Quote {
  quote: string;
}

export interface CalendarDayData {
  prayers: Array<{ name: string; prayed: boolean }>;
}

export interface CalendarMonthSummary {
  missed: number;
  qazaDone: number;
  adaPrayers: number;
  mostCommonReason: string;
  mostMissedPrayer: string;
  completionRate?: number;
}

export interface CalendarData {
  year: number;
  month: number;
  userId: number;
  dailyData: { [day: number]: CalendarDayData };
  monthSummary: CalendarMonthSummary;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

export interface AdaPrayerLog {
  prayer: string;
  status: 'completed' | 'missed';
  reason?: string;
}

export interface LogAdaPayload {
  prayers: AdaPrayerLog[];
}

export interface LogQazaPayload {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export const api = {
  async getUserInfo(userId: number): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/qaza/user_info/${userId}`);
    return handleResponse(response);
  },

  async getTotalQaza(userId: number): Promise<QazaTotal> {
    const response = await fetch(`${API_BASE_URL}/qaza/total/${userId}`);
    return handleResponse(response);
  },

  async getQazaBreakdown(userId: number): Promise<QazaBreakdown> {
    const response = await fetch(`${API_BASE_URL}/qaza/breakdown/${userId}`);
    return handleResponse(response);
  },

  async getPrayerStats(userId: number): Promise<PrayerStats> {
    const response = await fetch(`${API_BASE_URL}/qaza/stats/${userId}`);
    return handleResponse(response);
  },

  async getWeeklyActivity(userId: number): Promise<WeeklyActivity[]> {
    const response = await fetch(`${API_BASE_URL}/qaza/activity/weekly/${userId}`);
    return handleResponse(response);
  },

  async getMonthSummary(userId: number, year: number, month: number): Promise<MonthSummary> {
    const response = await fetch(`${API_BASE_URL}/qaza/calendar/summary/${userId}?year=${year}&month=${month}`);
    return handleResponse(response);
  },

  async logAdaPrayer(userId: number, payload: LogAdaPayload): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/qaza/log/ada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...payload }),
    });
    return handleResponse(response);
  },

  async logQazaPrayer(userId: number, payload: LogQazaPayload): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/qaza/log/qaza`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...payload }),
    });
    return handleResponse(response);
  },

  async markQazasPrayed(userId: number, payload: LogQazaPayload): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/qaza/mark_prayed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...payload }),
    });
    return handleResponse(response);
  },

  async getQuote(): Promise<Quote> {
    const response = await fetch(`${API_BASE_URL}/qaza/quotes`);
    return handleResponse(response);
  },

  async getCalendarData(userId: number, year: number, month: number): Promise<CalendarData> {
    const response = await fetch(`${API_BASE_URL}/qaza/calendar/${userId}?year=${year}&month=${month}`);
    return handleResponse(response);
  },
};
