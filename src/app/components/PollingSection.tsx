import { useState, useEffect, useRef } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

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

  useEffect(() => {
    fetchVotesAndUserChoice();
    const interval = setInterval(fetchVotes, 5000);

    return () => {
      clearInterval(interval);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const fetchVotesAndUserChoice = async () => {
    await Promise.all([fetchVotes(), fetchUserChoice()]);
  };

  // --- Fetch votes terbaru dari Edge Function ---
  const fetchVotes = async () => {
    try {
      const endpoint = pollType === "location" ? "votes/location" : "votes/date";
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-861a1fb5/${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch votes: ${response.status}`);

      const data = await response.json();
      const pollData = data?.votes || {};
      const counts: PollData = {};

      // Pastikan semua opsi punya nilai
      options.forEach(option => {
        counts[option] = pollData[option] ?? 0;
      });

      setVotes(counts);
      setLoading(false);
      setError(null);

    } catch (err) {
      console.error(`Error fetching votes for ${pollType}:`, err);
      const defaultVotes: PollData = {};
      options.forEach(option => (defaultVotes[option] = 0));
      setVotes(defaultVotes);
      setLoading(false);
      setError("Koneksi ke server gagal");
    }
  };

  const fetchUserChoice = async () => {
    try {
      const userId = anonymousUserId.current;
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-861a1fb5/my-vote/${pollType}/${userId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.hasVoted && data.option) {
        setSelectedOption(data.option);
        setSavedOption(data.option);
        setShowThankYou(true);
      }
    } catch (err) {
      console.error(`Error fetching user choice for ${pollType}:`, err);
    }
  };

  const handleOptionClick = async (option: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setShowThankYou(false);

    if (savedOption === option) {
      await deleteVote();
      setSelectedOption(null);
      setSavedOption(null);
      return;
    }

    setSelectedOption(option);
    saveTimeoutRef.current = setTimeout(() => saveVote(option), 3000);
  };

  const saveVote = async (option: string) => {
    setSaving(true);
    try {
      const userId = anonymousUserId.current;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-861a1fb5/vote/${pollType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ anonymousUserId: userId, option }),
        }
      );

      if (!response.ok) throw new Error("Failed to vote");

      await fetchVotes(); // update votes setelah save
      setSavedOption(option);
      setShowThankYou(true);
      console.log(`Vote saved successfully: ${option}`);

    } catch (err) {
      console.error(`Error voting for ${pollType}:`, err);
      setError("Gagal menyimpan vote");
      setSelectedOption(savedOption);
    } finally {
      setSaving(false);
    }
  };

  const deleteVote = async () => {
    try {
      const userId = anonymousUserId.current;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-861a1fb5/vote/${pollType}/${userId}`,
        { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` } }
      );

      if (!response.ok) throw new Error("Failed to delete vote");

      await fetchVotes();
      setSelectedOption(null);
      setSavedOption(null);
      console.log(`Vote deleted successfully`);

    } catch (err) {
      console.error(`Error deleting vote for ${pollType}:`, err);
      setError("Gagal menghapus vote");
    }
  };

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
        <>
          <div className="space-y-3">
            {options.map(option => {
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
                  {/* Progress Background */}
                  {!isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00417e]/5 to-transparent transition-all duration-500" style={{ width: `${percentage}%` }} />
                  )}

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-white bg-white' : 'border-gray-400'
                        }`}>
                          {isSelected && <div className={`w-3 h-3 rounded-full transition-all ${isSaved ? 'bg-[#00417e]' : 'bg-blue-500'}`} />}
                        </div>
                        <span className="font-semibold text-sm md:text-base">{option}</span>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        isSelected ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'
                      }`}>
                        {percentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isSelected ? 'bg-white/30' : 'bg-white/50 backdrop-blur-sm'}`}>
                        <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                          isSelected ? 'bg-white' : 'bg-gradient-to-r from-[#00417e] to-blue-500'
                        }`} style={{ width: `${percentage}%` }} />
                      </div>
                      <span className={`text-xs min-w-[4rem] text-right ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                        {voteCount} suara
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
