'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Share2, Download, Copy, Check, Map as MapIcon, Globe, LayoutTemplate, Languages, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import { toPng } from 'html-to-image';
import 'mapbox-gl/dist/mapbox-gl.css';
import { translateObject } from '@/app/actions/translate';

interface SharePosterModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any; // The word evolution data
}

const TARGET_LANGUAGES = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
];

function getAllMarkers(data: any) {
    const markers = [];
    if (data.root?.location) markers.push({ ...data.root.location, type: 'root' });
    if (data.path) data.path.forEach((p: any) => {
        if (p.location) markers.push({ ...p.location, type: 'path' });
    });
    if (data.current?.location) markers.push({ ...data.current.location, type: 'current' });
    return markers;
}

function getRouteGeoJson(data: any) {
    const coords = getAllMarkers(data).map((m: any) => [m.lng, m.lat]);
    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: coords
        }
    };
}

export default function SharePosterModal({ isOpen, onClose, data }: SharePosterModalProps) {
    const [copied, setCopied] = useState(false);
    const [showMap, setShowMap] = useState(true);
    const [isGlobe, setIsGlobe] = useState(true);
    const [isWide, setIsWide] = useState(false);
    const posterRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Translation State
    const [translatedData, setTranslatedData] = useState(data);
    const [targetLang, setTargetLang] = useState('es');
    const [isTranslating, setIsTranslating] = useState(false);

    // Reset translated data when data prop changes
    useEffect(() => {
        setTranslatedData(data);
    }, [data]);

    // Use translated data for display
    const displayData = translatedData || data;

    // Calculate markers from DISPLAY data (though locations shouldn't change)
    const markers = displayData ? getAllMarkers(displayData) : [];
    const countryCodes = displayData ? Array.from(new Set(markers.map((m: any) => m.country_code).filter(Boolean))) : [];

    const handleTranslate = async () => {
        if (!data) return;
        setIsTranslating(true);
        try {
            // Construct object with only fields needing translation
            const contentToTranslate = {
                root: { meaning: data.root.meaning, language: data.root.language },
                path: (data.path || []).map((p: any) => ({ meaning: p.meaning, language: p.language })),
                current: { meaning: data.current.meaning, language: data.current.language }
            };

            const result = await translateObject(contentToTranslate, targetLang);

            // Merge translated fields back into original structure
            const merged = {
                ...data, // Keep original structure (locations, years, etc)
                root: { ...data.root, ...result.root },
                path: (data.path || []).map((p: any, i: number) => ({ ...p, ...result.path[i] })),
                current: { ...data.current, ...result.current }
            };

            setTranslatedData(merged);
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleDownload = async () => {
        if (!posterRef.current) return;
        setIsDownloading(true);

        // Store original styles to restore later
        const originalMapCanvas = posterRef.current.querySelector('.mapboxgl-canvas') as HTMLCanvasElement;
        const originalDisplay = originalMapCanvas ? originalMapCanvas.style.display : '';

        let tempImg: HTMLImageElement | null = null;

        try {
            // New Approach: html-to-image
            // 1. Manually snapshot map canvas
            // 2. Insert image BEFORE canvas (so markers stay on top)
            // 3. Hide original canvas to clean up rendering
            // 4. Render poster
            // 5. Cleanup

            const mapContainer = posterRef.current.querySelector('.mapboxgl-map') as HTMLElement;

            if (originalMapCanvas && mapContainer) {
                try {
                    const url = originalMapCanvas.toDataURL();
                    tempImg = document.createElement('img');
                    tempImg.src = url;

                    // Match dimensions exactly to avoid stretching
                    tempImg.style.position = 'absolute';
                    tempImg.style.top = '0';
                    tempImg.style.left = '0';
                    tempImg.style.width = '100%';
                    tempImg.style.height = '100%';
                    tempImg.style.objectFit = 'cover'; // Use cover to fill container without distortion
                    tempImg.style.pointerEvents = 'none'; // Don't block interactions if any

                    // Insert before the canvas so markers (which are usually after or z-indexed higher) stay on top
                    if (originalMapCanvas.parentNode) {
                        originalMapCanvas.parentNode.insertBefore(tempImg, originalMapCanvas);
                        originalMapCanvas.style.display = 'none'; // Checkmate webgl
                    }
                } catch (e) {
                    console.warn('Failed to Create map overlay:', e);
                }
            }

            // Small delay to ensure DOM update paints
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture full scroll height
            const node = posterRef.current;
            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#0a0a0a',
                width: node.offsetWidth, // Match the visible width exactly
                height: node.scrollHeight,
                style: {
                    overflow: 'visible', // Ensure hidden overflow is rendered
                    height: 'auto',      // Allow height to expand to fit content
                    maxHeight: 'none',   // Remove any max-height constraints
                    width: `${node.offsetWidth}px`, // Force clone to match original width
                }
            });

            const link = document.createElement('a');
            link.download = `etymo-${displayData.current.word}-poster.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            // Cleanup: Remove temp image and restore canvas
            if (tempImg && tempImg.parentNode) {
                tempImg.parentNode.removeChild(tempImg);
            }
            if (originalMapCanvas) {
                originalMapCanvas.style.display = originalDisplay;
            }
            setIsDownloading(false);
        }
    };

    const handleCopy = () => {
        const text = `The evolution of "${displayData?.current?.word}":\n` +
            `${displayData?.root?.word} (${displayData?.root?.language}) -> ` +
            `${displayData?.path?.map((s: any) => s.word).join(' -> ')} -> ` +
            `${displayData?.current?.word} (${displayData?.current?.language})\n\n` +
            `Discover more on Etymo!`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!data) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`relative w-full ${isWide ? 'max-w-6xl' : 'max-w-2xl'} bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] transition-all duration-500`}
                    >
                        {/* Poster Preview Area */}
                        <div ref={posterRef} className="flex-1 p-8 bg-gradient-to-br from-[#111827] to-black relative overflow-y-auto scrollbar-hide">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(59,130,246,0.1)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[rgba(168,85,247,0.1)] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                            {/* Top Section: Map + Header */}
                            <div className={isWide ? "grid grid-cols-2 gap-8 mb-8 items-center" : "mb-8 text-center"}>
                                {/* Map Column */}
                                <div className={isWide ? "order-2" : ""}>
                                    {showMap && (
                                        <div className={`relative z-10 w-full h-48 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-2xl mix-blend-screen ${!isWide && 'mb-6'}`}>
                                            <Map
                                                key={isGlobe ? 'globe' : 'mercator'}
                                                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                                                initialViewState={{
                                                    longitude: data.root?.location?.lng || 0,
                                                    latitude: data.root?.location?.lat || 20,
                                                    zoom: 0.5,
                                                }}
                                                mapStyle="mapbox://styles/mapbox/dark-v11"
                                                projection={isGlobe ? 'globe' : 'mercator'}
                                                attributionControl={false}
                                                style={{ width: '100%', height: '100%' }}
                                                preserveDrawingBuffer={true}
                                            >
                                                {countryCodes.length > 0 && (
                                                    <Layer
                                                        id="country-highlight"
                                                        type="line"
                                                        source="composite"
                                                        source-layer="admin"
                                                        filter={['all', ['==', 'admin_level', 0], ['in', 'iso_3166_1', ...countryCodes]]}
                                                        paint={{
                                                            'line-color': '#f59e0b',
                                                            'line-width': 2,
                                                            'line-opacity': 0.8
                                                        }}
                                                    />
                                                )}

                                                {markers.map((m: any, i: number) => (
                                                    <Marker key={i} longitude={m.lng} latitude={m.lat}>
                                                        <div className={`w-2 h-2 rounded-full ring-2 ring-black ${i === 0 ? 'bg-[#3b82f6]' : i === markers.length - 1 ? 'bg-[#facc15]' : 'bg-[rgba(255,255,255,0.5)]'}`} />
                                                    </Marker>
                                                ))}

                                                {markers.length > 1 && (
                                                    <Source id="route" type="geojson" data={getRouteGeoJson(displayData) as any}>
                                                        <Layer
                                                            id="route"
                                                            type="line"
                                                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                                            paint={{
                                                                'line-color': 'rgba(255,255,255,0.5)',
                                                                'line-width': 1.5,
                                                                'line-dasharray': [2, 1]
                                                            }}
                                                        />
                                                    </Source>
                                                )}
                                            </Map>
                                        </div>
                                    )}
                                </div>

                                {/* Header Column */}
                                <div className={`relative z-10 ${isWide ? 'text-left order-1' : 'mb-8'}`}>
                                    <div className="inline-block px-3 py-1 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.6)] mb-4">
                                        Etymological Journey
                                    </div>
                                    <h2 className={`font-serif text-white font-bold mb-2 ${isWide ? 'text-6xl' : 'text-4xl md:text-5xl'}`}>
                                        {displayData.current.word}
                                    </h2>
                                    <p className="text-[rgba(255,255,255,0.4)] text-sm uppercase tracking-widest">
                                        {displayData.current.language} • {displayData.current.year || 'Modern'}
                                    </p>
                                </div>
                            </div>

                            {/* Steps Grid/List */}
                            <div className={`relative z-10 ${isWide ? 'grid grid-cols-3 gap-4 auto-rows-fr' : 'space-y-0'}`}>
                                {([
                                    { ...displayData.root, type: 'root', stepLabel: 'Root' },
                                    ...(displayData.path || []).map((p: any) => ({ ...p, type: 'path', stepLabel: p.year })),
                                    { ...displayData.current, type: 'current', stepLabel: 'Today' }
                                ]).map((step: any, i: number, arr: any[]) => (
                                    <div key={i} className={isWide ? "p-5 rounded-2xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex flex-col gap-3 group hover:border-[rgba(255,255,255,0.2)] transition-colors h-full justify-center" : ""}>
                                        <div className="flex items-center gap-4 group">
                                            {/* Icon Logic */}
                                            {step.type === 'root' && (
                                                <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-bold text-[rgba(255,255,255,0.4)] shrink-0 group-hover:bg-[rgba(59,130,246,0.2)] group-hover:text-[#60a5fa] group-hover:border-[rgba(59,130,246,0.5)] transition-colors">
                                                    Root
                                                </div>
                                            )}
                                            {step.type === 'path' && (
                                                <>
                                                    <div className={`w-3 h-3 rounded-full bg-[rgba(255,255,255,0.2)] ml-[18px] mr-[14px] shrink-0 group-hover:bg-white group-hover:shadow-[0_0_10px_white] transition-all ${isWide ? 'hidden' : ''}`} />
                                                    {isWide && (
                                                        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[10px] text-[rgba(255,255,255,0.3)] font-mono shrink-0 border border-[rgba(255,255,255,0.05)]">
                                                            {i}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {step.type === 'current' && (
                                                <div className="w-12 h-12 rounded-full bg-[rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.5)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                                    <div className="w-3 h-3 bg-[#60a5fa] rounded-full shadow-[0_0_10px_#60a5fa]" />
                                                </div>
                                            )}

                                            {/* Text Content */}
                                            <div>
                                                <div className={`font-serif text-white ${step.type === 'current' ? 'text-2xl' : step.type === 'root' ? 'text-xl text-[rgba(255,255,255,0.9)]' : 'text-lg text-[rgba(255,255,255,0.8)]'}`}>
                                                    {step.word}
                                                </div>
                                                <div className={`text-[10px] uppercase tracking-widest ${step.type === 'current' ? 'text-[#60a5fa] font-bold' : 'text-[rgba(255,255,255,0.4)]'}`}>
                                                    {step.language} • {step.stepLabel}
                                                </div>
                                                <div className="text-xs text-[rgba(255,255,255,0.5)] italic mt-0.5">"{step.meaning}"</div>
                                            </div>
                                        </div>

                                        {/* Connector Line (Vertical List Only) */}
                                        {!isWide && i < arr.length - 1 && (
                                            <div className={`w-px ${step.type === 'path' ? 'h-8 my-2' : step.type === 'root' ? 'h-8' : 'h-4 -mt-6 mb-2'} bg-gradient-to-b ${i === arr.length - 2 ? 'from-[rgba(255,255,255,0.1)] to-[rgba(59,130,246,0.5)]' : 'from-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0.1)]'} ml-6`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="w-full md:w-64 bg-white/5 border-l border-white/10 p-6 flex flex-col justify-between backdrop-blur-md">
                            <div>
                                <div className="mb-6">
                                    <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2">Options</div>
                                    <button
                                        onClick={() => setShowMap(!showMap)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all mb-2 ${showMap ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <MapIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">Show Map</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showMap ? 'bg-blue-500' : 'bg-white/20'}`}>
                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${showMap ? 'translate-x-4' : ''}`} />
                                        </div>
                                    </button>

                                    {showMap && (
                                        <button
                                            onClick={() => setIsGlobe(!isGlobe)}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all mb-2 ${isGlobe ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4" />
                                                <span className="text-sm font-medium">Globe View</span>
                                            </div>
                                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isGlobe ? 'bg-purple-500' : 'bg-white/20'}`}>
                                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isGlobe ? 'translate-x-4' : ''}`} />
                                            </div>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setIsWide(!isWide)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isWide ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <LayoutTemplate className="w-4 h-4" />
                                            <span className="text-sm font-medium">Wide Layout</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isWide ? 'bg-green-500' : 'bg-white/20'}`}>
                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isWide ? 'translate-x-4' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Translation Options */}
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2">Translate</div>
                                        <div className="flex gap-2">
                                            <select
                                                value={targetLang}
                                                onChange={(e) => setTargetLang(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg text-xs text-white p-2 flex-1 outline-none focus:border-blue-500/50"
                                            >
                                                {TARGET_LANGUAGES.map(lang => (
                                                    <option key={lang.code} value={lang.code} className="bg-[#1f2937]">
                                                        {lang.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleTranslate}
                                                disabled={isTranslating}
                                                className="bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                                                title="Translate Poster"
                                            >
                                                {isTranslating ? <Loader2 className="animate-spin w-4 h-4" /> : <Languages className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-blue-400" />
                                    Share Journey
                                </h3>
                                <p className="text-xs text-white/40 mb-6">
                                    Spread the knowledge across cultures.
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleCopy}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-black/40 text-white/60 group-hover:text-white'}`}>
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Copy Text</div>
                                            <div className="text-[10px] text-white/40">Copy format for easy pasting</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className="w-full text-left p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group/dl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="text-xs text-blue-300 font-medium mb-1 flex items-center gap-2 group-hover/dl:text-blue-200 transition-colors">
                                            <Download className={`w-3 h-3 ${isDownloading ? 'animate-bounce' : ''}`} />
                                            {isDownloading ? 'Generating...' : 'Download Poster'}
                                        </div>
                                        <p className="text-[10px] text-blue-200/60 leading-relaxed group-hover/dl:text-blue-200/80 transition-colors">
                                            Save this journey as a high-quality image to share anywhere!
                                        </p>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="mt-6 w-full py-3 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
