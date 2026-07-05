import { useState } from 'react'
import { isMockMode } from './firebase'
import { useNearbyVenues } from './hooks/useNearbyVenues'
import { usePresence } from './hooks/usePresence'
import { VenueCard } from './components/VenueCard'
import { VenueDetail } from './components/VenueDetail'
import { CheckInModal } from './components/CheckInModal'
import { CheckedInScreen } from './components/CheckedInScreen'
import type { NearbyVenue } from './types'

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="sk sk-thumb" />
      <div className="sk-body">
        <div className="sk sk-line w60" />
        <div className="sk sk-line w40" />
      </div>
    </div>
  )
}

export default function App() {
  const { venues, locationStatus, loading, error } = useNearbyVenues()
  const { checkedInVenueId, busy, checkIn, checkOut } = usePresence()
  const [detailVenue, setDetailVenue] = useState<NearbyVenue | null>(null)
  const [pendingVenue, setPendingVenue] = useState<NearbyVenue | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)

  const checkedInVenue = checkedInVenueId
    ? (venues.find((v) => v.id === checkedInVenueId) ?? null)
    : null

  async function handleConfirm() {
    if (!pendingVenue) return
    try {
      await checkIn(pendingVenue.id)
      setPendingVenue(null)
      setDetailVenue(null)
      setCheckInError(null)
    } catch (err) {
      console.error('체크인 실패:', err)
      setCheckInError('체크인에 실패했어요. 잠시 후 다시 시도해 주세요.')
    }
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
      ) : detailVenue ? (
        <VenueDetail
          venue={detailVenue}
          onBack={() => setDetailVenue(null)}
          onSelect={setPendingVenue}
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
            <div className="venue-list">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : venues.length === 0 && !error ? (
            <div className="empty">아직 등록된 매장이 없어요</div>
          ) : (
            <div className="venue-list">
              {venues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onOpenDetail={setDetailVenue}
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
          error={checkInError}
          onConfirm={handleConfirm}
          onCancel={() => {
            setPendingVenue(null)
            setCheckInError(null)
          }}
        />
      )}
    </>
  )
}
