'use client';

import { Play, Pause, SkipBack, SkipForward, Rewind } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface TimelineProps {
    year: number;
    setYear: Dispatch<SetStateAction<number>>;
    steps: number[];
    isPlaying: boolean;
    onTogglePlay: () => void;
}

export default function Timeline({ year, setYear, steps, isPlaying, onTogglePlay }: TimelineProps) {
    if (!steps || steps.length === 0) return null;

    const currentIndex = steps.indexOf(year);
    // Calculated based on index now, not percentage of year value
    const progress = (currentIndex / (steps.length - 1)) * 100;

    const handleStepChange = (newIndex: number) => {
        if (newIndex >= 0 && newIndex < steps.length) {
            setYear(steps[newIndex]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            {/* Main Controller Card */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-3">

                {/* Header: Controls & Year Display */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <button
                            onClick={onTogglePlay}
                            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95 group"
                        >
                            {isPlaying ?
                                <Pause className="w-4 h-4 fill-current" /> :
                                <Play className="w-4 h-4 fill-current ml-1" />
                            }
                        </button>

                        {/* Step Controls */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => handleStepChange(currentIndex - 1)}
                                disabled={currentIndex <= 0}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <SkipBack className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleStepChange(currentIndex + 1)}
                                disabled={currentIndex >= steps.length - 1}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <SkipForward className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Current Year Display */}
                        <div className="ml-2 flex flex-col justify-center">
                            <span className="text-2xl font-serif font-bold text-white tracking-wide tabular-nums leading-none">
                                {year < 0 ? `${Math.abs(year)} BC` : year}
                            </span>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="flex gap-2">
                        {currentIndex > 0 && (
                            <button
                                onClick={() => handleStepChange(0)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                title="Reset to Origin"
                            >
                                <Rewind className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar Container */}
                <div className="relative h-6 group select-none flex items-center mt-1 mx-1">
                    {/* Background Track */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full" />

                    {/* Active Progress Line */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />

                    {/* Step Dots */}
                    <div className="absolute inset-x-0 w-full flex justify-between items-center pointer-events-none z-10">
                        {steps.map((step, idx) => {
                            const isPast = idx <= currentIndex;
                            const isCurrent = idx === currentIndex;
                            return (
                                <div
                                    key={step}
                                    className={`relative transition-all duration-300 ${isCurrent ? 'w-3 h-3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-110' : isPast ? 'w-1.5 h-1.5 bg-blue-400' : 'w-1.5 h-1.5 bg-white/20'}`}
                                    style={{ borderRadius: '50%' }}
                                >
                                    {/* Tooltip on hover/active */}
                                    {isCurrent && (
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded opacity-100 whitespace-nowrap shadow-sm">
                                            {step < 0 ? `${Math.abs(step)} BC` : step}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Interaction Layer */}
                    <input
                        type="range"
                        min={0}
                        max={steps.length - 1}
                        step={1}
                        value={currentIndex}
                        onChange={(e) => handleStepChange(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        title="Drag to change time"
                    />
                </div>
            </div>
        </div>
    );
}
