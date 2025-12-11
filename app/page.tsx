"use client";

import { useState } from "react";
import { GeneratorForm } from "@/components/GeneratorForm";
import { ContentCalendar } from "@/components/ContentCalendar";
import { GeneratorFormData, CalendarData } from "@/lib/types";
import { AlertCircle, Plus, Loader2 } from "lucide-react";

export default function Home() {
  const [calendarWeeks, setCalendarWeeks] = useState<CalendarData[]>([]);
  const [lastFormData, setLastFormData] = useState<GeneratorFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWeek = async (formData: GeneratorFormData, offset: number, prevTopics: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          weekOffset: offset,
          previousTopics: prevTopics,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data: CalendarData = await response.json();
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Generation (Week 0)
  const handleGenerate = async (formData: GeneratorFormData) => {
    setLastFormData(formData);
    setCalendarWeeks([]); // Clear previous results
    
    const data = await generateWeek(formData, 0, []);
    if (data) {
      setCalendarWeeks([data]);
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Generate Next Week
  const handleGenerateNextWeek = async () => {
    if (!lastFormData) return;

    const currentOffset = calendarWeeks.length;
    // Collect all topics used so far to avoid repetition
    const usedTopics = calendarWeeks.flatMap(week => 
        week.posts.map(p => p.topic).filter(Boolean) as string[]
    );

    const data = await generateWeek(lastFormData, currentOffset, usedTopics);
    if (data) {
      setCalendarWeeks(prev => [...prev, data]);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white selection:bg-purple-500/30">
        
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-fade-in" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-fade-in delay-500" />
      </div>

      <div className="relative z-10 px-4 py-16 md:py-24 max-w-7xl mx-auto space-y-24">
        
        {/* Hero Section */}
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-linear-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent animate-in fade-in zoom-in-95 duration-1000">
            Reddit Mastermind
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Generate authentic, undetectable Reddit marketing campaigns. 
            Simulate organic threads, manage personas, and dominate the conversation.
          </p>
        </div>

        {/* Input Section */}
        <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading && calendarWeeks.length === 0} />

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-500/10 border border-red-500/25 rounded-xl flex items-center gap-3 text-red-200 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Section */}
        {calendarWeeks.length > 0 && (
          <div id="results-section" className="scroll-mt-12 min-h-[80vh] space-y-12">
            {calendarWeeks.map((weekData, idx) => (
               <div key={idx} className="relative">
                  {idx > 0 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-zinc-700 text-sm">▼</div>}
                  <ContentCalendar data={weekData} />
               </div>
            ))}

            {/* Load More Button */}
            <div className="flex justify-center pb-20">
              <button
                onClick={handleGenerateNextWeek}
                disabled={isLoading}
                className="group relative px-8 py-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                  <div className="flex items-center gap-3">
                    {isLoading ? (
                         <Loader2 className="animate-spin text-zinc-400" />
                    ) : (
                         <Plus className="text-zinc-400 group-hover:text-white transition-colors" />
                    )}
                    <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">
                        {isLoading ? "Forging Next Week..." : "Generate Next Week"}
                    </span>
                  </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
