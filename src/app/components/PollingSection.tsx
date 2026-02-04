import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface PollData {
  [key: string]: number;
}

interface PollingSectionProps {
  title: string;
  options: string[];
  pollType: "location" | "date";
}

export function PollingSection({ title, options, pollType }: PollingSectionProps) {
  const [votes, setVotes] = useState<PollData>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVotes();
    }, 500);
    
    const interval = setInterval(fetchVotes, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const fetchVotes = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-861a1fb5/votes`;
      
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
      const pollData = pollType === "location" ? data.locationVotes : data.dateVotes;
      setVotes(pollData);
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

  const handleVote = async (option: string) => {
    if (hasVoted || voting) return;

    setVoting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-861a1fb5/vote/${pollType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ [pollType]: option }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      setVotes(data.votes);
      setHasVoted(true);
      
      localStorage.setItem(`voted-${pollType}`, "true");
    } catch (error) {
      console.error(`Error voting for ${pollType}:`, error);
    } finally {
      setVoting(false);
    }
  };

  useEffect(() => {
    const voted = localStorage.getItem(`voted-${pollType}`);
    if (voted === "true") {
      setHasVoted(true);
    }
  }, [pollType]);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

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
              
              return (
                <button
                  key={option}
                  onClick={() => handleVote(option)}
                  disabled={hasVoted || voting}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group ${
                    hasVoted
                      ? "bg-gray-50/50 cursor-not-allowed border border-gray-200"
                      : "bg-white/50 hover:bg-[#00417e] hover:text-white hover:shadow-xl hover:scale-[1.02] border border-[#00417e]/20 hover:border-[#00417e] cursor-pointer"
                  }`}
                >
                  {/* Progress Background */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-[#00417e]/5 to-transparent transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm md:text-base">{option}</span>
                      <span className="text-sm font-bold px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full">
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/50 backdrop-blur-sm rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00417e] to-blue-500 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 min-w-[4rem] text-right">
                        {voteCount} suara
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {hasVoted && (
            <div className="mt-6 glass-card-sm p-4 text-center">
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
