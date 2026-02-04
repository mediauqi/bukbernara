import { useState, useEffect, useRef } from "react";
import { supabase } from "/utils/supabase/client"; // pastikan supabase client sudah di-setup

interface PollData {
  [key: string]: number;
}

interface PollingSectionProps {
  title: string;
  options: string[];
  pollType: "location" | "date";
}

// Generate or retrieve anonymous user ID
function getAnonymousUserId(): string {
  const STORAGE_KEY = 'anonymous_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }
  
  return userId;
}

export function PollingSection({ title, options, pollType }: PollingSectionProps) {
  const [votes, setVotes] = useState<PollData>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [savedOption, setSavedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const anonymousUserId = useRef<string>(getAnonymousUserId());

  // --- Fetch votes dari tabel polls ---
  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('option');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((v: { option: string }) => {
        counts[v.option] = (counts[v.option] || 0) + 1;
      });

      setVotes(counts);
      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('Error fetching votes:', err);
      const defaultVotes: PollData = {};
      options.forEach(option => defaultVotes[option] = 0);
      setVotes(defaultVotes);
      setLoading(false);
      setError("Koneksi ke server gagal");
    }
  };

  // --- Fetch pilihan user ---
  const fetchUserChoice = async () => {
    try {
      const userId = anonymousUserId.current;
      const { data, error } = await supabase
        .from('polls')
        .select('option')
        .eq('anonymousUserId', userId)
        .single();

      if (error) return;

      if (data && data.option) {
        setSelectedOption(data.option);
        setSavedOption(data.option);
        setShowThankYou(true);
      }
    } catch (err) {
      console.error('Error fetching user choice:', err);
    }
  };

  // --- Save vote ---
  const saveVote = async (option: string) => {
    setSaving(true);

    try {
      const userId = anonymousUserId.current;

      // Delete dulu kalau sebelumnya ada vote
      if (savedOption) {
        await supabase
          .from('polls')
          .delete()
          .eq('anonymousUserId', userId)
          .eq('option', savedOption);
      }

      // Insert vote baru
      const { error } = await supabase
        .from('polls')
        .insert({ anonymousUserId: userId, option });

      if (error) throw error;

      setSavedOption(option);
      setShowThankYou(true);

      // Refresh vote counts
      await fetchVotes();

      console.log(`Vote saved successfully: ${option}`);
    } catch (err) {
      console.error('Error saving vote:', err);
      setError("Gagal menyimpan vote");
      setSelectedOption(savedOption);
    } finally {
      setSaving(false);
    }
  };

  // --- Delete vote ---
  const deleteVote = async () => {
    try {
      const userId = anonymousUserId.current;

      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('anonymousUserId', userId)
        .eq('option', selectedOption);

      if (error) throw error;

      setSelectedOption(null);
      setSavedOption(null);
      setShowThankYou(false);

      // Refresh vote counts
      await fetchVotes();

      console.log('Vote deleted successfully');
    } catch (err) {
      console.error('Error deleting vote:', err);
      setError("Gagal menghapus vote");
    }
  };

  // --- Handle klik pilihan ---
  const handleOptionClick = (option: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setShowThankYou(false);

    if (savedOption === option) {
      deleteVote();
      return;
    }

    setSelectedOption(option);

    // Auto save after 3 detik
    saveTimeoutRef.current = setTimeout(() => {
      saveVote(option);
    }, 3000);
  };

  // --- useEffect init ---
  useEffect(() => {
    fetchVotes();
    fetchUserChoice();

    const interval = setInterval(fetchVotes, 5000);

    return () => {
      clearInterval(interval);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const totalVotes = Object.values(votes || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-semibold text-[#00417e] mb-2">{title}</h3>
        <p className="text-sm text-gray-500">
          Total: <span className="font-semibold text-[#00417e]">{totalVotes}</span> suara
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#00417e] rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option) => {
            const voteCount = votes[option] || 0;
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : "0";
            const isSelected = selectedOption === option;
            const isSaved = savedOption === option;

            return (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                disabled={saving}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group ${
                  isSelected && isSaved
                    ? "bg-gradient-to-r from-[#00417e] to-[#0052a3] text-white shadow-xl scale-[1.02] border-2 border-[#00417e]"
                    : isSelected && !isSaved
                    ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg scale-[1.01] border-2 border-blue-400"
                    : "bg-white/50 hover:bg-white hover:shadow-lg hover:scale-[1.01] border border-[#00417e]/20 hover:border-[#00417e]/40"
                } ${saving ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
              >
                <div className="relative z-10 flex justify-between items-center">
                  <span className="font-semibold">{option}</span>
                  <span>{voteCount} suara ({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-4 text-center text-yellow-700">
          {error}
        </div>
      )}

      {showThankYou && savedOption && !saving && (
        <div className="mt-4 text-center text-green-700">
          Terima kasih! Vote Anda sudah tercatat
        </div>
      )}
    </div>
  );
}
