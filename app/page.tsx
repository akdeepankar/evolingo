'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GalaxyView from '@/components/GalaxyView';

// ... (imports)
import Globe from '@/components/Globe';
import Timeline from '@/components/Timeline';
import ActionPanel from '@/components/ActionPanel';
import Settings from '@/components/Settings';
import Sidebar from '@/components/Sidebar';
import FuturePrediction from '@/components/results/FuturePrediction';
import ChatSidebar from '@/components/chat/ChatSidebar';
import SavedCollection from '@/components/chat/SavedCollection';
import CulturalInsightModal from '@/components/CulturalInsightModal';
import SharePosterModal from '@/components/SharePosterModal';
import { STATIC_CONTENT, SIDEBAR_CONTENT } from '@/lib/constants';
import { translateObject } from '@/app/actions/translate';

export default function Home() {
  const [year, setYear] = useState(2024);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [timelineRange, setTimelineRange] = useState<{ min: number; max: number } | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<number[]>([]);

  // Insight Modal State
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [idiomData, setIdiomData] = useState<any>(null);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<any>(null);

  // UI States
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Explore Mode
  const [isExploreMode, setIsExploreMode] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState<'globe' | 'galaxy'>('globe');

  // Translation State
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState(STATIC_CONTENT);
  const [sidebarTranslations, setSidebarTranslations] = useState(SIDEBAR_CONTENT);

  const handleOpenShare = (data: any) => {
    setShareData(data);
    setShowShareModal(true);
  };

  const handleMarkerClick = async (marker: any) => {
    // Only if marker has cultural insight
    if (!marker.cultural_insight || !marker.word || !marker.label) {
      // If clicked but no insight, maybe just log or ignore
      if (marker.word && marker.label) console.log("Marker clicked, no insight:", marker);
      return;
    }

    setIsPlaying(false);
    setShowInsightModal(true);
    // If English, loading is instant/none. If translating, show loading.
    if (currentLanguage === 'en') {
      setIsLoadingInsight(false);
      setIdiomData({
        word: marker.word,
        language: marker.label,
        ...marker.cultural_insight
      });
      return;
    }

    setIsLoadingInsight(true);
    const baseData = {
      word: marker.word,
      language: marker.label,
      ...marker.cultural_insight
    };

    try {
      const toTranslate = {
        meaning: baseData.meaning,
        origin_story: baseData.origin_story
      };
      const translated = await translateObject(toTranslate, currentLanguage);
      setIdiomData({ ...baseData, ...translated });
    } catch (e) {
      console.error("Translation failed", e);
      setIdiomData(baseData);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    const fetchTranslations = async () => {
      if (currentLanguage === 'en') {
        setTranslations(STATIC_CONTENT);
        setSidebarTranslations(SIDEBAR_CONTENT);
        return;
      }

      // Check cache first
      try {
        const cachedUI = sessionStorage.getItem(`translation_ui_${currentLanguage}`);
        const cachedSidebar = sessionStorage.getItem(`translation_sidebar_${currentLanguage}`);

        if (cachedUI && cachedSidebar) {
          setTranslations(JSON.parse(cachedUI));
          setSidebarTranslations(JSON.parse(cachedSidebar));
          return;
        }
      } catch (e) {
        console.warn("Session storage access failed", e);
      }

      try {
        const [translatedUI, translatedSidebar] = await Promise.all([
          translateObject(STATIC_CONTENT, currentLanguage),
          translateObject(SIDEBAR_CONTENT, currentLanguage)
        ]);

        setTranslations(translatedUI as any);
        setSidebarTranslations(translatedSidebar as any);

        // Cache results
        try {
          sessionStorage.setItem(`translation_ui_${currentLanguage}`, JSON.stringify(translatedUI));
          sessionStorage.setItem(`translation_sidebar_${currentLanguage}`, JSON.stringify(translatedSidebar));
        } catch (e) {
          console.warn("Failed to cache translations", e);
        }
      } catch (error) {
        console.error("Failed to translate UI:", error);
      }
    };

    fetchTranslations();
  }, [currentLanguage]);

  // Playback Logic
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '0.5x'>('1x');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    if (timelineSteps.length === 0) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" }, // Hint for browser tab
        audio: false
      });

      const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
        ? "video/webm; codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `evolingo_${searchResult?.root?.word || 'animation'}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsPlaying(false);
      };

      recorder.start();
      setIsRecording(true);

      // Reset and play
      setYear(timelineSteps[0]);
      setTimeout(() => setIsPlaying(true), 1000); // Wait for recorder overlay/UI to settle

    } catch (err) {
      console.error("Video export failed", err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Correction for duration map based on "0.5x" label meaning Slower
    const computedDurations = {
      '1x': 2000,
      '0.5x': 4000
    };

    if (isPlaying && timelineSteps.length > 0) {
      interval = setInterval(() => {
        setYear((currentYear) => {
          const currentIndex = timelineSteps.indexOf(currentYear);
          // If we are at the end
          if (currentIndex === -1 || currentIndex >= timelineSteps.length - 1) {
            if (isRecording) {
              stopRecording();
            } else {
              setIsPlaying(false);
            }
            return currentYear;
          }
          // Move to next step
          return timelineSteps[currentIndex + 1];
        });
      }, computedDurations[playbackSpeed]);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timelineSteps, playbackSpeed, isRecording]);

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
    if (!data) return;
    setSearchResult(data);

    console.log("Processing Data:", data);

    const newSteps: number[] = [];
    const newMarkers: any[] = [];
    let minYear = data.root?.year || 2024;
    let maxYear = 2024;

    // 1. Root
    if (data.root) {
      newSteps.push(data.root.year);
      if (data.root.year < minYear) minYear = data.root.year;
      newMarkers.push({
        lat: data.root.location?.lat || 0,
        lng: data.root.location?.lng || 0,
        label: data.root.language,
        year: data.root.year,
        word: data.root.word,
        country_code: data.root.location?.country_code,
        cultural_insight: data.root.cultural_insight
      });
    }

    // 2. Path
    if (data.path && Array.isArray(data.path)) {
      data.path.forEach((step: any) => {
        newSteps.push(step.year);
        if (step.year < minYear) minYear = step.year;
        if (step.year > maxYear) maxYear = step.year;
        newMarkers.push({
          lat: step.location?.lat || 0,
          lng: step.location?.lng || 0,
          label: step.language,
          year: step.year,
          word: step.word,
          country_code: step.location?.country_code,
          cultural_insight: step.cultural_insight
        });
      });
    }

    // 3. Current
    if (data.current) {
      const currentYear = data.current.year || 2024;
      newSteps.push(currentYear);
      if (currentYear > maxYear) maxYear = currentYear;
      newMarkers.push({
        lat: data.current.location?.lat || 0,
        lng: data.current.location?.lng || 0,
        label: data.current.language,
        year: currentYear,
        word: data.current.word,
        country_code: data.current.location?.country_code,
        cultural_insight: data.current.cultural_insight
      });
    }

    // Sort steps
    const sortedSteps = Array.from(new Set(newSteps)).sort((a, b) => a - b);
    setTimelineSteps(sortedSteps);
    setTimelineRange({ min: minYear, max: maxYear });
    setMarkers(newMarkers);
    setYear(sortedSteps[0] || minYear);
    setIsPlaying(false);
    setHasSearched(true);
    setIsExploreMode(false); // Reset explore mode on new search
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
        currentLanguage={currentLanguage}
        translations={sidebarTranslations}
        onOpenShare={handleOpenShare}
        onToggleExploreMode={() => setIsExploreMode(!isExploreMode)}
        isExploreMode={isExploreMode}
        onToggleViewMode={() => setViewMode(viewMode === 'globe' ? 'galaxy' : 'globe')}
        viewMode={viewMode}
      />

      <div className="absolute inset-0 z-0">
        {viewMode === 'globe' ? (
          <Globe
            markers={markers}
            year={year}
            onMarkerClick={handleMarkerClick}
            isExploreMode={isExploreMode}
          />
        ) : (
          <GalaxyView data={searchResult} />
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        {/* Pointer events auto for interactive elements */}
        <div className="pointer-events-auto">
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
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              translations={translations}
            />
          </div>
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
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              onExport={startRecording}
              isRecording={isRecording}
            />
          )}
        </div>
      </div>

      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentWordData={searchResult}
        onLoadSharedWord={processWordData}
        currentLanguage={currentLanguage}
      />

      <SavedCollection
        isOpen={showCollection}
        onClose={() => setShowCollection(false)}
        onViewWord={processWordData}
      />

      <CulturalInsightModal
        isOpen={showInsightModal}
        onClose={() => setShowInsightModal(false)}
        isLoading={isLoadingInsight}
        data={idiomData}
      />

      <SharePosterModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={shareData}
      />
    </main>
  );
}
