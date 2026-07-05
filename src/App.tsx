import { useState } from 'react'
import { isMockMode } from './firebase'
import { useNearbyVenues } from './hooks/useNearbyVenues'
import { usePresence } from './hooks/usePresence'
import { VenueCard } from './components/VenueCard'
import { CheckInModal } from './components/CheckInModal'
import { CheckedInScreen } from './components/CheckedInScreen'
import type { NearbyVenue } from './types'

export default function App() {
  const { venues, locationStatus, loading, error } = useNearbyVenues()
  const { checkedInVenueId, busy, checkIn, checkOut } = usePresence()
  const [pendingVenue, setPendingVenue] = useState<NearbyVenue | null>(null)

  const checkedInVenue = checkedInVenueId
    ? (venues.find((v) => v.id === checkedInVenueId) ?? null)
    : null

  async function handleConfirm() {
    if (!pendingVenue) return
    await checkIn(pendingVenue.id)
    setPendingVenue(null)
  }

  return (
    <>
      <header className="header">
        <h1>혼자리</h1>
        <span className="tagline">혼술바 실시간 자리 상황</span>
        {isMockMode && <span className="mock-badge">MOCK</span>}
      </header>

      {checkedInVenueId ? (
        <CheckedInScreen
          venueId={checkedInVenueId}
          venue={checkedInVenue}
          busy={busy}
          onCheckOut={checkOut}
        />
      ) : (
        <main>
          {locationStatus === 'denied' && !error && (
            <div className="notice">
              위치 권한이 없어 거리를 표시할 수 없어요. 브라우저 설정에서 위치
              접근을 허용하면 가까운 순으로 보여드려요.
            </div>
          )}
          {error && <div className="notice">{error}</div>}
          {loading ? (
            <div className="loading">주변 매장을 찾는 중…</div>
          ) : venues.length === 0 && !error ? (
            <div className="empty">아직 등록된 매장이 없어요</div>
          ) : (
            <div className="venue-list">
              {venues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onSelect={setPendingVenue}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {pendingVenue && !checkedInVenueId && (
        <CheckInModal
          venue={pendingVenue}
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={() => setPendingVenue(null)}
        />
      )}
    </>
  )
}
