import { useState, useEffect } from 'react';
import { Check, X, Minus, Plus, Mic, Trash2 } from 'lucide-react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, QazaBreakdown } from '../services/api';

type TabType = 'ada' | 'qaza' | 'clear';
type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

interface AdaPrayer {
  name: PrayerName;
  completed: boolean;
  missed: boolean;
  reason?: string;
  otherReason?: string;
  voiceMessage?: Blob;
  voiceMessageUrl?: string;
}

interface QazaPrayer {
  name: PrayerName;
  count: number;
}

export default function LogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ada');
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerName | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [adaPrayers, setAdaPrayers] = useState<AdaPrayer[]>([
    { name: 'Fajr', completed: false, missed: false },
    { name: 'Dhuhr', completed: false, missed: false },
    { name: 'Asr', completed: false, missed: false },
    { name: 'Maghrib', completed: false, missed: false },
    { name: 'Isha', completed: false, missed: false },
  ]);

  const [qazaPrayers, setQazaPrayers] = useState<QazaPrayer[]>([
    { name: 'Fajr', count: 0 },
    { name: 'Dhuhr', count: 0 },
    { name: 'Asr', count: 0 },
    { name: 'Maghrib', count: 0 },
    { name: 'Isha', count: 0 },
  ]);

  const [clearPrayers, setClearPrayers] = useState<QazaPrayer[]>([
    { name: 'Fajr', count: 0 },
    { name: 'Dhuhr', count: 0 },
    { name: 'Asr', count: 0 },
    { name: 'Maghrib', count: 0 },
    { name: 'Isha', count: 0 },
  ]);

  const [qazaLimits, setQazaLimits] = useState<QazaBreakdown | null>(null);

  const [isRecording, setIsRecording] = useState<PrayerName | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    initTelegramApp();
    const id = getTelegramUserId();
    setUserId(id);

    if (id) {
      api.getQazaBreakdown(id)
        .then(setQazaLimits)
        .catch(err => console.error('Failed to fetch qaza breakdown', err));
    }
  }, []);

  const reasons = ['Sleep', 'Work/Study', 'Travel', 'Health', 'Forgot', 'Voice Message', 'Other'];

  const markPrayerCompleted = (name: PrayerName) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name
          ? { ...p, completed: true, missed: false, reason: undefined, otherReason: undefined }
          : p
      )
    );
    setExpandedPrayer(null);
  };

  const markPrayerMissed = (name: PrayerName) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name ? { ...p, missed: true, completed: false } : p
      )
    );
    setExpandedPrayer(expandedPrayer === name ? null : name);
  };

  const setReasonForPrayer = (name: PrayerName, reason: string) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name
          ? { ...p, reason, otherReason: reason === 'Other' ? p.otherReason : undefined }
          : p
      )
    );
  };

  const setOtherReasonForPrayer = (name: PrayerName, otherReason: string) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name ? { ...p, otherReason } : p
      )
    );
  };

  const startRecording = async (name: PrayerName) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAdaPrayers(prayers =>
          prayers.map(p =>
            p.name === name
              ? { ...p, voiceMessage: blob, voiceMessageUrl: url }
              : p
          )
        );
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(name);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
      setIsRecording(null);
    }
  };

  const deleteVoiceMessage = (name: PrayerName) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name
          ? { ...p, voiceMessage: undefined, voiceMessageUrl: undefined }
          : p
      )
    );
  };

  const updateQazaCount = (name: PrayerName, delta: number) => {
    setQazaPrayers(prayers =>
      prayers.map(p =>
        p.name === name ? { ...p, count: Math.max(0, p.count + delta) } : p
      )
    );
  };

  const updateClearCount = (name: PrayerName, delta: number) => {
    setClearPrayers(prayers =>
      prayers.map(p => {
        if (p.name === name) {
          const maxLimit = qazaLimits ? qazaLimits[name.toLowerCase() as keyof QazaBreakdown] : Infinity;
          const newCount = Math.max(0, p.count + delta);
          return { ...p, count: Math.min(newCount, maxLimit) };
        }
        return p;
      })
    );
  };

  const handleSaveAda = async () => {
    if (!userId) {
      setSaveMessage('Unable to save: User ID not found');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      // Convert to correct format for FastAPI
      const prayersToSave = adaPrayers
        .filter(prayer => prayer.completed || prayer.missed) // Only send prayers that have a status
        .map(prayer => ({
          prayer: prayer.name.toLowerCase(), // ✅ Changed from prayer_name
          status: prayer.completed ? 'completed' : 'missed', // ✅ Changed from booleans
          reason: prayer.missed && prayer.reason ? 
            (prayer.reason === 'Other' ? prayer.otherReason : prayer.reason) : 
            undefined,
        }));

      if (prayersToSave.length === 0) {
        setSaveMessage('Please mark at least one prayer');
        setSaving(false);
        return;
      }

      await api.logAdaPrayer(userId, { prayers: prayersToSave });
      setSaveMessage('Ada prayers saved successfully!');

      // Reset state
      setAdaPrayers([
        { name: 'Fajr', completed: false, missed: false },
        { name: 'Dhuhr', completed: false, missed: false },
        { name: 'Asr', completed: false, missed: false },
        { name: 'Maghrib', completed: false, missed: false },
        { name: 'Isha', completed: false, missed: false },
      ]);
      setExpandedPrayer(null);

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save ada prayers', error);
      setSaveMessage('Failed to save prayers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQaza = async () => {
    if (!userId) {
      setSaveMessage('Unable to save: User ID not found');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const dataToSave = {
        fajr: qazaPrayers.find(p => p.name === 'Fajr')?.count || 0,
        dhuhr: qazaPrayers.find(p => p.name === 'Dhuhr')?.count || 0,
        asr: qazaPrayers.find(p => p.name === 'Asr')?.count || 0,
        maghrib: qazaPrayers.find(p => p.name === 'Maghrib')?.count || 0,
        isha: qazaPrayers.find(p => p.name === 'Isha')?.count || 0,
      };

      await api.logQazaPrayer(userId, dataToSave);
      setSaveMessage('Qaza prayers saved successfully!');

      // Reset counts
      setQazaPrayers([
        { name: 'Fajr', count: 0 },
        { name: 'Dhuhr', count: 0 },
        { name: 'Asr', count: 0 },
        { name: 'Maghrib', count: 0 },
        { name: 'Isha', count: 0 },
      ]);

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save qaza prayers', error);
      setSaveMessage('Failed to save prayers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClear = async () => {
    if (!userId) {
      setSaveMessage('Unable to save: User ID not found');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const dataToSave = {
        fajr: clearPrayers.find(p => p.name === 'Fajr')?.count || 0,
        dhuhr: clearPrayers.find(p => p.name === 'Dhuhr')?.count || 0,
        asr: clearPrayers.find(p => p.name === 'Asr')?.count || 0,
        maghrib: clearPrayers.find(p => p.name === 'Maghrib')?.count || 0,
        isha: clearPrayers.find(p => p.name === 'Isha')?.count || 0,
      };

      await api.markQazasPrayed(userId, dataToSave);
      setSaveMessage('Qaza prayers marked as prayed!');

      setClearPrayers([
        { name: 'Fajr', count: 0 },
        { name: 'Dhuhr', count: 0 },
        { name: 'Asr', count: 0 },
        { name: 'Maghrib', count: 0 },
        { name: 'Isha', count: 0 },
      ]);

      if (userId) {
        api.getQazaBreakdown(userId)
          .then(setQazaLimits)
          .catch(err => console.error('Failed to refresh qaza breakdown', err));
      }

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to mark qaza prayers', error);
      setSaveMessage('Failed to save prayers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Log Prayers</h1>
          <p className="text-gray-400 text-base">
            {activeTab === 'ada' && "Mark today's prayers"}
            {activeTab === 'qaza' && 'Add a missed prayer to your backlog'}
            {activeTab === 'clear' && 'Mark backlog prayers as made up'}
          </p>
        </header>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('ada')}
            className={`flex-1 py-4 rounded-2xl font-medium text-base transition-all ${
              activeTab === 'ada'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('qaza')}
            className={`flex-1 py-4 rounded-2xl font-medium text-base transition-all ${
              activeTab === 'qaza'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            Add Missed
          </button>
          <button
            onClick={() => setActiveTab('clear')}
            className={`flex-1 py-4 rounded-2xl font-medium text-base transition-all ${
              activeTab === 'clear'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            Mark Done
          </button>
        </div>

        {activeTab === 'ada' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-teal-700/30 overflow-hidden">
              {adaPrayers.map((prayer, index) => (
                <div key={prayer.name}>
                  <div className="flex items-center justify-between p-5">
                    <span className="text-xl">{prayer.name}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => markPrayerCompleted(prayer.name)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          prayer.completed
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'border-emerald-700/50 hover:border-emerald-500'
                        }`}
                      >
                        <Check
                          size={20}
                          className={prayer.completed ? 'text-emerald-500' : 'text-gray-400'}
                        />
                      </button>
                      <button
                        onClick={() => markPrayerMissed(prayer.name)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          prayer.missed
                            ? 'bg-gray-800 border-gray-600'
                            : 'border-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <X size={20} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {expandedPrayer === prayer.name && prayer.missed && (
                    <div className="px-5 pb-5 pt-2 bg-gray-800/20">
                      <p className="text-gray-300 text-sm font-medium mb-1">Reason (optional)</p>
                      <p className="text-gray-500 text-xs mb-4">For personal reflection only</p>
                      <div className="flex flex-wrap gap-2">
                        {reasons.map((reason) => (
                          <button
                            key={reason}
                            onClick={() => setReasonForPrayer(prayer.name, reason)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              prayer.reason === reason
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>

                      {prayer.reason === 'Other' && (
                        <div className="mt-4">
                          <input
                            type="text"
                            placeholder="Please specify..."
                            value={prayer.otherReason || ''}
                            onChange={(e) => setOtherReasonForPrayer(prayer.name, e.target.value)}
                            className="w-full bg-gray-800/50 border border-teal-700/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                      )}

                      {prayer.reason === 'Voice Message' && (
                        <div className="mt-4 space-y-3">
                          {!prayer.voiceMessageUrl ? (
                            <button
                              onClick={() =>
                                isRecording === prayer.name
                                  ? stopRecording()
                                  : startRecording(prayer.name)
                              }
                              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                                isRecording === prayer.name
                                  ? 'bg-red-500/20 border border-red-500 text-red-400'
                                  : 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/30'
                              }`}
                            >
                              <Mic size={18} />
                              {isRecording === prayer.name ? 'Stop Recording' : 'Record Voice Message'}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <audio
                                src={prayer.voiceMessageUrl}
                                controls
                                className="flex-1 h-10"
                              />
                              <button
                                onClick={() => deleteVoiceMessage(prayer.name)}
                                className="w-10 h-10 rounded-lg bg-gray-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {index < adaPrayers.length - 1 && (
                    <div className="h-px bg-gray-800/50 mx-5"></div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveAda}
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors py-4 rounded-2xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saveMessage && (
              <div className={`text-center text-sm ${saveMessage.includes('successfully') ? 'text-emerald-400' : 'text-red-400'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        )}

        {activeTab === 'qaza' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-teal-700/30 overflow-hidden">
              {qazaPrayers.map((prayer, index) => (
                <div key={prayer.name}>
                  <div className="flex items-center justify-between p-5">
                    <span className="text-xl">{prayer.name}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateQazaCount(prayer.name, -1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-teal-700/50 hover:bg-gray-800/50 transition-colors"
                      >
                        <Minus size={18} className="text-gray-400" />
                      </button>
                      <span className="text-2xl font-medium w-12 text-center">{prayer.count}</span>
                      <button
                        onClick={() => updateQazaCount(prayer.name, 1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-emerald-500 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Plus size={18} className="text-emerald-500" />
                      </button>
                    </div>
                  </div>
                  {index < qazaPrayers.length - 1 && (
                    <div className="h-px bg-gray-800/50 mx-5"></div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveQaza}
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors py-4 rounded-2xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saveMessage && (
              <div className={`text-center text-sm ${saveMessage.includes('successfully') ? 'text-emerald-400' : 'text-red-400'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clear' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-teal-700/30 overflow-hidden">
              {clearPrayers.map((prayer, index) => {
                const maxLimit = qazaLimits ? qazaLimits[prayer.name.toLowerCase() as keyof QazaBreakdown] : 0;
                return (
                  <div key={prayer.name}>
                    <div className="flex items-center justify-between p-5">
                      <div className="flex flex-col">
                        <span className="text-xl">{prayer.name}</span>
                        {qazaLimits && (
                          <span className="text-xs text-gray-500">Max: {maxLimit}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => updateClearCount(prayer.name, -1)}
                          className="w-10 h-10 rounded-full flex items-center justify-center border border-teal-700/50 hover:bg-gray-800/50 transition-colors"
                        >
                          <Minus size={18} className="text-gray-400" />
                        </button>
                        <span className="text-2xl font-medium w-12 text-center">{prayer.count}</span>
                        <button
                          onClick={() => updateClearCount(prayer.name, 1)}
                          disabled={prayer.count >= maxLimit}
                          className="w-10 h-10 rounded-full flex items-center justify-center border border-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={18} className="text-emerald-500" />
                        </button>
                      </div>
                    </div>
                    {index < clearPrayers.length - 1 && (
                      <div className="h-px bg-gray-800/50 mx-5"></div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSaveClear}
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors py-4 rounded-2xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saveMessage && (
              <div className={`text-center text-sm ${saveMessage.includes('successfully') || saveMessage.includes('prayed') ? 'text-emerald-400' : 'text-red-400'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
