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
    // Generate a unique ID
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
    // Fetch initial data
    fetchVotesAndUserChoice();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchVotes, 5000);
    
    return () => {
      clearInterval(interval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const fetchVotesAndUserChoice = async () => {
    await Promise.all([
      fetchVotes(),
      fetchUserChoice()
    ]);
  };

  const fetchVotes = async () => {
  try {
    const endpoint =
      pollType === "location"
        ? "votes/location"
        : "votes/date";

    const url = `https://${projectId}.supabase.co/functions/v1/make-server-861a1fb5/${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch votes: ${response.status}`);
    }

    const data = await response.json();
    setVotes(data?.votes ?? {});
    setLoading(false);
    setError(null);
  } catch (error) {
    console.error(`Error fetching votes for ${pollType}:`, error);

    const defaultVotes: PollData = {};
    options.forEach(option => {
      defaultVotes[option] = 0;
    });

    setVotes(defaultVotes);
    setLoading(false);
    setError(`Koneksi ke server gagal`);
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
      
      if (!response.ok) {
        console.error('Failed to fetch user choice');
        return;
      }
      
      const data = await response.json();
      
      if (data.hasVoted && data.option) {
        setSelectedOption(data.option);
        setSavedOption(data.option);
        setShowThankYou(true);
      }
    } catch (error) {
      console.error(`Error fetching user choice for ${pollType}:`, error);
    }
  };

  const handleOptionClick = async (option: string) => {
    // Clear any pending save timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setShowThankYou(false);
    
    // Case 1: Click on already saved option = CANCEL/DELETE vote
    if (savedOption === option) {
      await deleteVote();
      setSelectedOption(null);
      setSavedOption(null);
      return;
    }
    
    // Case 2: Select new option (may overwrite old one)
    setSelectedOption(option);
    
    // Auto-save after 3 seconds
    saveTimeoutRef.current = setTimeout(() => {
      saveVote(option);
    }, 3000);
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
          body: JSON.stringify({ 
            anonymousUserId: userId,
            option: option
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      
      // Update vote counts
      setVotes(data?.votes ?? votes);
      
      setSavedOption(option);
      setShowThankYou(true);
      
      console.log(`Vote saved successfully: ${option}`);
    } catch (error) {
      console.error(`Error voting for ${pollType}:`, error);
      setError("Gagal menyimpan vote");
      
      // Rollback on error
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
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete vote");
      }

      const data = await response.json();
      
      // Update vote counts
      if (data.votes) {
        setVotes(data.votes);
      }
      
      console.log(`Vote deleted successfully`);
    } catch (error) {
      console.error(`Error deleting vote for ${pollType}:`, error);
      setError("Gagal menghapus vote");
    }
  };

  const totalVotes = Object.values(votes || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-semibold text-[#00417e] mb-2">
          {title}
        </h3>
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
                  {/* Progress Background for unselected */}
                  {!isSelected && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-[#00417e]/5 to-transparent transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {/* Selection Indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-white bg-white' 
                            : 'border-gray-400'
                        }`}>
                          {isSelected && (
                            <div className={`w-3 h-3 rounded-full transition-all ${
                              isSaved ? 'bg-[#00417e]' : 'bg-blue-500'
                            }`} />
                          )}
                        </div>
                        <span className="font-semibold text-sm md:text-base">{option}</span>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        isSelected 
                          ? 'bg-white/20 backdrop-blur-sm' 
                          : 'bg-white/50 backdrop-blur-sm'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                        isSelected ? 'bg-white/30' : 'bg-white/50 backdrop-blur-sm'
                      }`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                            isSelected 
                              ? 'bg-white' 
                              : 'bg-gradient-to-r from-[#00417e] to-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`text-xs min-w-[4rem] text-right ${
                        isSelected ? 'text-white/90' : 'text-gray-600'
                      }`}>
                        {voteCount} suara
                      </span>
                    </div>
                  </div>
                  
                  {/* Saving Indicator */}
                  {isSelected && !isSaved && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* Saved Check Mark */}
                  {isSaved && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center text-sm">
            {selectedOption && !savedOption && !saving && (
              <p className="flex items-center justify-center gap-2 text-gray-600">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span>Pilihan akan tersimpan dalam 3 detik...</span>
              </p>
            )}
            {saving && (
              <p className="flex items-center justify-center gap-2 text-blue-600">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span>Menyimpan pilihan Anda...</span>
              </p>
            )}
            {!selectedOption && !savedOption && (
              <p className="text-gray-500">Pilih opsi untuk memberikan suara</p>
            )}
            {savedOption && (
              <p className="text-gray-500">Klik pilihan Anda untuk membatalkan, atau pilih yang lain untuk mengganti</p>
            )}
          </div>

          {/* Thank You Message */}
          {showThankYou && savedOption && !saving && (
            <div className="mt-6 glass-card-sm p-4 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Terima kasih! Vote Anda sudah tercatat</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 glass-card-sm p-4 text-center">
              <p className="text-yellow-700 text-sm">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
