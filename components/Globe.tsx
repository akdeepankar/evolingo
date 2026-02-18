'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Map, { Source, Layer, MapRef, Marker } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MarkerData {
    lat: number;
    lng: number;
    label?: string;
    year?: number;
    word?: string;
    country_code?: string;
}

interface GlobeProps {
    markers?: MarkerData[];
    year?: number;
    isExploreMode?: boolean;
    onMarkerClick?: (marker: MarkerData) => void;
}

export default function Globe({ markers = [], year = 2024, isExploreMode = false, onMarkerClick }: GlobeProps) {
    const mapRef = useRef<MapRef>(null);
    const [token, setToken] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('mapbox_access_token');
        const envToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        if (storedToken) {
            setToken(storedToken);
        } else if (envToken) {
            setToken(envToken);
        }
        setMounted(true);
    }, []);

    // Active Path Logic
    const activePath = useMemo(() => {
        if (!markers.length) return null;

        // Sort markers by year
        const sortedMarkers = [...markers].sort((a, b) => (a.year || 0) - (b.year || 0));

        // Filter markers
        // If Explore Mode -> Show ALL
        // If Timeline -> Show <= year
        const activeMarkers = isExploreMode
            ? sortedMarkers
            : sortedMarkers.filter(m => (m.year || 0) <= year);

        if (activeMarkers.length < 2) return null;

        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: activeMarkers.map(m => [m.lng, m.lat])
            }
        };
    }, [markers, year, isExploreMode]);

    // Active Countries Logic
    // If explore mode, we want ALL country codes involved
    const activeCountryCodes = useMemo(() => {
        if (!markers.length) return [];

        const sortedMarkers = [...markers].sort((a, b) => (a.year || 0) - (b.year || 0));

        if (isExploreMode) {
            return [...new Set(sortedMarkers.map(m => m.country_code).filter(Boolean))];
        } else {
            // Original behavior: highlight latest active one
            const activeMarkers = sortedMarkers.filter(m => (m.year || 0) <= year);
            const currentMarker = activeMarkers[activeMarkers.length - 1];
            return currentMarker?.country_code ? [currentMarker.country_code] : [];
        }
    }, [markers, year, isExploreMode]);

    // Camera Animation Logic
    useEffect(() => {
        if (!mapRef.current || !markers.length) return;

        if (isExploreMode) {
            // Fit bounds to show all markers
            const bounds = new mapboxgl.LngLatBounds();
            markers.forEach(m => bounds.extend([m.lng, m.lat]));

            mapRef.current.fitBounds(bounds, {
                padding: 100,
                maxZoom: 4,
                duration: 2000,
                essential: true
            });
        } else {
            // Timeline behavior: Fly to latest
            const sortedMarkers = [...markers].sort((a, b) => (a.year || 0) - (b.year || 0));
            const activeMarkers = sortedMarkers.filter(m => (m.year || 0) <= year);
            const currentMarker = activeMarkers[activeMarkers.length - 1];

            if (currentMarker) {
                mapRef.current.flyTo({
                    center: [currentMarker.lng, currentMarker.lat],
                    zoom: 5,
                    speed: 1.2,
                    curve: 1.2,
                    essential: true
                });
            }
        }
    }, [year, markers.length, isExploreMode]); // Trigger on mode change too

    if (!mounted) return null;

    if (!token) {
        return (
            <div className="absolute inset-0 -z-10 flex items-center justify-center bg-black">
                <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur">
                    <h3 className="text-white font-bold mb-2">Mapbox Token Missing</h3>
                    <p className="text-white/60 text-sm mb-4">Please add your Mapbox Access Token in Settings</p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 -z-10 bg-black">
            <Map
                ref={mapRef}
                mapboxAccessToken={token}
                initialViewState={{
                    longitude: 0,
                    latitude: 20,
                    zoom: 1.5,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                projection={{ name: 'globe' }}
                fog={{
                    "range": [0.5, 10],
                    "color": "#000000",
                    "horizon-blend": 0.05,
                    "high-color": "#222",
                    "space-color": "#000000",
                    "star-intensity": 0.6
                }}
                interactive={true}
            >
                {/* 0. Country Highlight Layer */}
                <Source id="countries" type="geojson" data="https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson">
                    <Layer
                        id="country-highlight"
                        type="fill"
                        paint={{
                            'fill-color': 'rgba(96, 165, 250, 0.2)', // blue-400
                            'fill-outline-color': 'rgba(96, 165, 250, 0.6)'
                        }}
                        // Filter for ANY of the active country codes
                        filter={['in', 'iso_a2', ...activeCountryCodes]}
                    />
                </Source>

                {/* 1. Path Line Layer */}
                {activePath && (
                    <Source id="path-source" type="geojson" data={activePath as any}>
                        <Layer
                            id="path-layer"
                            type="line"
                            layout={{
                                'line-join': 'round',
                                'line-cap': 'round'
                            }}
                            paint={{
                                'line-color': '#60a5fa', // always blue-400
                                'line-width': 4,
                                'line-opacity': 0.8,
                                'line-blur': 1
                            }}
                        />
                    </Source>
                )}

                {/* 2. Markers */}
                {markers.map((marker, index) => {
                    // Show if explore mode OR if year condition met
                    const isVisible = isExploreMode || (marker.year || 0) <= year;

                    if (!isVisible) return null;

                    return (
                        <Marker key={index} longitude={marker.lng} latitude={marker.lat} anchor="center">
                            <div
                                className="relative flex items-center justify-center group cursor-pointer"
                                onClick={() => onMarkerClick && onMarkerClick(marker)}
                            >
                                {marker.label && (
                                    <div className="absolute bottom-full mb-3 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 z-10 pointer-events-none whitespace-nowrap">
                                        {marker.word && <span className="text-sm font-bold text-white mb-0.5">{marker.word}</span>}
                                        <div className="flex items-center gap-1 text-[10px] text-white/60">
                                            <span>{marker.label}</span>
                                            {marker.year && <span>({marker.year})</span>}
                                        </div>
                                        {/* Little triangle arrow pointing down */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45 border-r border-b border-white/10"></div>
                                    </div>
                                )}

                                <div className={`w-3 h-3 rounded-full border-2 border-white transition-all duration-500 
                                    ${(marker.year || 0) === year && !isExploreMode
                                        ? 'bg-yellow-400 scale-150 shadow-[0_0_20px_rgba(250,204,21,0.8)]'
                                        : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                    }`} />
                            </div>
                        </Marker>
                    );
                })}
            </Map>
        </div>
    );
}
