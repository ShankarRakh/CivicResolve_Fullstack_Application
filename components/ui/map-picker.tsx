'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Navigation } from 'lucide-react'

// ── Fix Leaflet default icon paths (broken by webpack bundling) ──
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Types ──
export interface MapPickerProps {
  initialLat?: number
  initialLng?: number
  onChange?: (lat: number, lng: number, address?: string) => void
  className?: string
  readOnly?: boolean
}

// ── Reverse geocode via Nominatim ──
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'CivicResolve/1.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.display_name || null
  } catch {
    return null
  }
}

// ── Forward search via Nominatim ──
interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

async function forwardGeocode(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`,
      { headers: { 'User-Agent': 'CivicResolve/1.0' } }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// ── Map click handler (internal sub-component) ──
function ClickHandler({
  onClick,
  readOnly,
}: {
  onClick: (lat: number, lng: number) => void
  readOnly?: boolean
}) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

// ── Fly to position (internal sub-component) ──
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
  }, [lat, lng, map])
  return null
}

// ── Main MapPicker (internal, rendered via dynamic import) ──
export default function MapPicker({
  initialLat = 18.5089,
  initialLng = 73.9259,
  onChange,
  className,
  readOnly = false,
}: MapPickerProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced forward search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (searchQuery.trim().length < 3) {
      setSearchResults([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const results = await forwardGeocode(searchQuery)
      setSearchResults(results)
      setShowResults(results.length > 0)
      setSearching(false)
    }, 800)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchQuery])

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setMarkerPos([lat, lng])
      const address = await reverseGeocode(lat, lng)
      onChange?.(lat, lng, address || undefined)
    },
    [onChange]
  )

  const handleMarkerDrag = useCallback(
    async (e: L.DragEndEvent) => {
      const latlng = e.target.getLatLng()
      setMarkerPos([latlng.lat, latlng.lng])
      const address = await reverseGeocode(latlng.lat, latlng.lng)
      onChange?.(latlng.lat, latlng.lng, address || undefined)
    },
    [onChange]
  )

  const handleSelectResult = useCallback(
    async (result: NominatimResult) => {
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      setMarkerPos([lat, lng])
      setFlyTarget([lat, lng])
      setSearchQuery(result.display_name)
      setShowResults(false)
      setSearchResults([])
      onChange?.(lat, lng, result.display_name)
    },
    [onChange]
  )

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setMarkerPos([latitude, longitude])
        setFlyTarget([latitude, longitude])
        const address = await reverseGeocode(latitude, longitude)
        onChange?.(latitude, longitude, address || undefined)
      },
      () => {
        // Silently fail — user denied permission
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [onChange])

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      {/* Search bar */}
      {!readOnly && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 50,
            right: 50,
            zIndex: 1000,
          }}
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="pl-9 pr-8 bg-white dark:bg-card shadow-md text-sm h-9"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {showResults && (
            <div className="mt-1 bg-white dark:bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-b-0 truncate"
                  onClick={() => handleSelectResult(r)}
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current location button */}
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute bottom-3 right-3 z-[1000] h-9 w-9 bg-white dark:bg-card shadow-md"
          onClick={handleCurrentLocation}
          title="Use my current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      )}

      {/* Map */}
      <MapContainer
        center={[initialLat, initialLng]}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={handleMapClick} readOnly={readOnly} />
        {flyTarget && <FlyTo lat={flyTarget[0]} lng={flyTarget[1]} />}
        {markerPos && (
          <Marker
            position={markerPos}
            draggable={!readOnly}
            eventHandlers={{ dragend: handleMarkerDrag }}
          />
        )}
      </MapContainer>

      {/* Helper text */}
      {!readOnly && !markerPos && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        >
          <p className="text-sm text-muted-foreground bg-white/90 dark:bg-card/90 px-3 py-1.5 rounded-md shadow-sm">
            Tap the map to set location
          </p>
        </div>
      )}
    </div>
  )
}