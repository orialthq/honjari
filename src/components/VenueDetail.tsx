import { useVenueCount } from '../hooks/useVenueCount'
import { countLabel, distanceLabel } from '../lib/format'
import type { NearbyVenue } from '../types'

interface Props {
  venue: NearbyVenue
  onBack: () => void
  onSelect: (venue: NearbyVenue) => void
}

export function VenueDetail({ venue, onBack, onSelect }: Props) {
  const count = useVenueCount(venue.id)
  const distance = distanceLabel(venue.distanceM)
  const quiet = count < 3

  return (
    <div className="detail">
      <button className="back-btn" onClick={onBack}>
        ← 주변 매장
      </button>
      <div className="hero">
        <img src={venue.photoUrl} alt={venue.name} />
        <div className="overlay">
          <div>
            <h2 className="venue-name">{venue.name}</h2>
            <p className="address">
              {venue.address}
              {distance && ` · ${distance}`}
            </p>
          </div>
          <span className={quiet ? 'count-badge quiet' : 'count-badge'}>
            <span className="live-dot" />
            {quiet ? countLabel(count) : `지금 ${count}명`}
          </span>
        </div>
      </div>
      {venue.tags.length > 0 && (
        <div className="tags">
          {venue.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="live-count">
        <div className="live-label">
          <span className="live-dot" /> 실시간
        </div>
        <div className="value">{countLabel(count)}</div>
        <div className="caption">지금 이 매장에서 혼술 중인 사람</div>
      </div>
      <button className="btn-primary" onClick={() => onSelect(venue)}>
        여기예요
      </button>
    </div>
  )
}
