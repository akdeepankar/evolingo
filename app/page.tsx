'use client';

import { useState, useEffect } from 'react';
import Globe from '@/components/Globe';
import Timeline from '@/components/Timeline';
import ActionPanel from '@/components/ActionPanel';
import Settings from '@/components/Settings';
import Sidebar from '@/components/Sidebar';
import FuturePrediction from '@/components/results/FuturePrediction';
import ChatSidebar from '@/components/chat/ChatSidebar';
import SavedCollection from '@/components/chat/SavedCollection';

export default function Home() {
  const [year, setYear] = useState(2024);
  const [searchResult, setSearchResult] = useState<any>(null); // Replace 'any' with proper type
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [timelineRange, setTimelineRange] = useState<{ min: number; max: number } | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<number[]>([]);

  // UI States
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Playback Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timelineSteps.length > 0) {
      interval = setInterval(() => {
        setYear((currentYear) => {
          const currentIndex = timelineSteps.indexOf(currentYear);
          // If we are at the end or valid index not found (shouldn't happen), stop
          if (currentIndex === -1 || currentIndex >= timelineSteps.length - 1) {
            setIsPlaying(false);
            return currentYear;
          }
          // Move to next step
          return timelineSteps[currentIndex + 1];
        });
      }, 2000); // 2 seconds per step for "one by one" animation
    }
    return () => clearInterval(interval);
  }, [isPlaying, timelineSteps]);

  const togglePlay = () => {
    if (!isPlaying && timelineSteps.length > 0) {
      // If at end, restart
      if (year >= timelineSteps[timelineSteps.length - 1]) {
        setYear(timelineSteps[0]);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const processWordData = (data: any) => {
    setSearchResult(data);
    const newMarkers: any[] = [];
    const uniqueYears = new Set<number>();

    if (data.root) {
      if (data.root.location) {
        newMarkers.push({
          ...data.root.location,
          label: data.root.language,
          year: data.root.year,
          word: data.root.word,
          country_code: data.root.location.country_code
        });
      }
      if (data.root.year) uniqueYears.add(data.root.year);
    }

    if (data.path) {
      data.path.forEach((step: any) => {
        if (step.location) {
          newMarkers.push({
            ...step.location,
            label: step.language,
            year: step.year,
            word: step.word,
            country_code: step.location.country_code
          });
        }
        if (step.year) uniqueYears.add(step.year);
      });
    }

    if (data.current) {
      if (data.current.location) {
        newMarkers.push({
          ...data.current.location,
          label: data.current.language,
          year: data.current.year,
          word: data.current.word,
          country_code: data.current.location.country_code
        });
      }
      if (data.current.year) uniqueYears.add(data.current.year);
    }

    const sortedSteps = Array.from(uniqueYears).sort((a, b) => a - b);
    setTimelineSteps(sortedSteps);
    setMarkers(newMarkers);
    if (sortedSteps.length > 0) {
      setYear(sortedSteps[0]);
      setIsPlaying(true);
      setTimelineRange({ min: sortedSteps[0], max: sortedSteps[sortedSteps.length - 1] });
    }
    setHasSearched(true);
  };

  const handleSearch = async (term: string) => {
    console.log(`Searching for: ${term}`);

    // Reset results
    setSearchResult(null);
    setPredictionResult(null);
    setMarkers([]);
    setTimelineRange(null);
    setTimelineSteps([]);
    setYear(-5000);
    setIsLoading(true);
    setHasSearched(true);

    const openaiKey = localStorage.getItem('openai_api_key');

    try {
      const etymologyRes = await fetch('/api/etymology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: term, apiKey: openaiKey })
      });

      if (etymologyRes.ok) {
        const etymologyData = await etymologyRes.json();
        processWordData(etymologyData);
      } else {
        console.error("Etymology fetch failed");
      }

      const predictionRes = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: term, year: 2050, apiKey: openaiKey })
      });

      if (predictionRes.ok) {
        const predictionData = await predictionRes.json();
        setPredictionResult(predictionData);
      } else {
        console.error("Prediction fetch failed");
      }

    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Sidebar for details */}
      <Sidebar
        data={searchResult}
        currentYear={year}
        onYearSelect={(selectedYear) => {
          setYear(selectedYear);
          setIsPlaying(false); // Pause playback if user manually jumps
        }}
      />

      <div className="absolute inset-0 z-0">
        <Globe markers={markers} year={year} />
      </div>

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        {/* Pointer events auto for interactive elements */}
        <div className="pointer-events-auto">
          <ActionPanel
            onSearch={handleSearch}
            isCompact={hasSearched}
            isLoading={isLoading}
            onOpenSettings={() => setShowSettings(true)}
            onOpenCollection={() => setShowCollection(true)}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onLogoClick={() => {
              setHasSearched(false);
              setSearchResult(null);
              setYear(2024);
              setIsPlaying(false);
              setTimelineSteps([]);
              setMarkers([]);
            }}
          />
        </div>

        {/* Results Area - Future styling can function similarly to Sidebar or float */}
        <div className="flex-1 w-full flex justify-end p-10 pointer-events-none">
          {year > 2024 && predictionResult && (
            <div className="pointer-events-auto">
              <FuturePrediction data={{ ...predictionResult, year }} />
            </div>
          )}
        </div>

        <div className="pointer-events-auto pb-10">
          {timelineSteps.length > 0 && (
            <Timeline
              year={year}
              setYear={setYear}
              steps={timelineSteps}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              isChatOpen={isChatOpen}
            />
          )}
        </div>
      </div>

      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentWordData={searchResult}
        onLoadSharedWord={processWordData}
      />

      <SavedCollection
        isOpen={showCollection}
        onClose={() => setShowCollection(false)}
        onViewWord={processWordData}
      />
    </main>
  );
}
