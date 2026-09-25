import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, PrayerStats } from '../services/api';

export default function ProfilePage() {
  const [prayerStats, setPrayerStats] = useState<PrayerStats | null>(null);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      initTelegramApp();
      const userId = getTelegramUserId();

      if (!userId) {
        setError('Unable to get Telegram user ID');
        setLoading(false);
        return;
      }

      try {
        const [userInfo, stats] = await Promise.all([
          api.getUserInfo(userId),
          api.getPrayerStats(userId),
        ]);

        setUserName(userInfo.name || 'User');
        setPrayerStats(stats);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalPrayersLogged = prayerStats?.total_prayers_logged ?? 0;
  const streak = prayerStats?.current_streak ?? 0;
  const nextMilestone = 1500;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-gray-400">Loading...</div>
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
          <h1 className="text-3xl font-semibold mb-1">Profile</h1>
          <p className="text-gray-400 text-base">Your statistics and journey</p>
        </header>

        <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 rounded-2xl p-6 border border-teal-700/40">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
              <User size={32} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{userName}</h2>
              <p className="text-gray-400 text-sm">Telegram User</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {totalPrayersLogged}
              </div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Prayers Logged</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {streak}
              </div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <h3 className="text-lg font-semibold mb-4">Progress to Milestone</h3>
          <p className="text-gray-400 text-sm mb-4">{nextMilestone} prayers logged</p>
          <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
              style={{ width: `${Math.min((totalPrayersLogged / nextMilestone) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-emerald-400 text-xs font-semibold mt-2">
            {Math.max(nextMilestone - totalPrayersLogged, 0)} more to go
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30 space-y-4">
          <h3 className="text-lg font-semibold">Quick Stats</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/30">
              <span className="text-gray-400">Daily Goal</span>
              <span className="text-emerald-400 font-semibold">{prayerStats?.daily_goal ?? 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/30">
              <span className="text-gray-400">Completed Today</span>
              <span className="text-emerald-400 font-semibold">{prayerStats?.completed_today ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">This Week</span>
              <span className="text-emerald-400 font-semibold">{prayerStats?.cleared_this_week ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
