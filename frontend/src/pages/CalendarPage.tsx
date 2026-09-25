import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, CalendarData, CalendarMonthSummary } from '../services/api';

interface DayPrayers {
  [key: number]: {
    prayers: Array<{ name: string; prayed: boolean }>;
  };
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userId, setUserId] = useState<number | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initTelegramApp();
    const id = getTelegramUserId();
    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    setLoading(true);
    setError(null);

    api.getCalendarData(userId, year, month)
      .then(data => {
        setCalendarData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch calendar data', err);
        setError('Failed to load calendar data');
        setLoading(false);
      });
  }, [userId, currentMonth]);

  const monthData: CalendarMonthSummary = calendarData?.monthSummary || {
    adaPrayers: 0,
    missed: 0,
    qazaDone: 0,
    mostMissedPrayer: '-',
    mostCommonReason: '-',
  };

  const daysWithPrayers: DayPrayers = calendarData?.dailyData || {};

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const isDateInPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate <= today;
  };

  const getDayBackground = (day: number) => {
    if (!isDateInPast(day)) return 'bg-gray-800/30';

    const dayData = daysWithPrayers[day as keyof typeof daysWithPrayers];
    if (!dayData) return 'bg-gray-800/30';

    const prayedCount = dayData.prayers.filter(p => p.prayed).length;
    const missedCount = 5 - prayedCount;

    if (prayedCount === 5) return 'bg-emerald-900/40';
    if (missedCount === 5) return 'bg-red-900/40';
    if (prayedCount > missedCount) return 'bg-amber-900/40';
    return 'bg-orange-900/40';
  };

  const getPrayerDots = (day: number) => {
    if (!isDateInPast(day)) return null;

    const dayData = daysWithPrayers[day as keyof typeof daysWithPrayers];
    if (!dayData) return null;

    return (
      <div className="flex gap-1 justify-center mt-1.5">
        {dayData.prayers.map((prayer, index) => (
          <div
            key={index}
            className={`w-1 h-1 rounded-full ${
              prayer.prayed ? 'bg-emerald-400' : 'bg-red-500'
            }`}
          ></div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-gray-400">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Calendar</h1>
          <p className="text-gray-400 text-base">Daily prayer history</p>
        </header>

        <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 rounded-2xl p-6 border border-teal-700/40">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{monthName} Summary</h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-teal-700/30 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-teal-700/30 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {monthData.adaPrayers}
              </div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Ada Prayers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {monthData.missed}
              </div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Missed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-500 mb-1">
                {monthData.qazaDone}
              </div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Qaza Done</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-teal-700/30">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Most missed prayer</span>
              <span className="text-white font-semibold">{monthData.mostMissedPrayer}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Most common reason</span>
              <span className="text-white font-semibold">{monthData.mostCommonReason}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square"></div>
              ))}
              {days.map((day) => (
                <div
                  key={day}
                  className={`aspect-square ${getDayBackground(day)} rounded-full border border-gray-700/40 flex flex-col items-center justify-center p-2 hover:border-teal-600/50 transition-colors cursor-pointer`}
                >
                  <span className="text-sm font-semibold">{day}</span>
                  {getPrayerDots(day)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700/30">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Indicators:</p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-gray-400">Ada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-400">Missed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
