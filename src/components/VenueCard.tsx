import { useVenueCount } from '../hooks/useVenueCount'
import { countLabel, distanceLabel } from '../lib/format'
import type { NearbyVenue } from '../types'

interface Props {
  venue: NearbyVenue
  onOpenDetail: (venue: NearbyVenue) => void
  onSelect: (venue: NearbyVenue) => void
}

export function VenueCard({ venue, onOpenDetail, onSelect }: Props) {
  const count = useVenueCount(venue.id)
  const distance = distanceLabel(venue.distanceM)
  const quiet = count < 3

  return (
    <article className="venue-card" onClick={() => onOpenDetail(venue)}>
      <div className="thumb">
        <img src={venue.photoUrl} alt={venue.name} loading="lazy" />
        <span className={quiet ? 'count-badge quiet' : 'count-badge'}>
          <span className="live-dot" />
          {quiet ? countLabel(count) : `지금 ${count}명`}
        </span>
      </div>
      <div className="body">
        <div className="title-row">
          <h3 className="name">{venue.name}</h3>
          {distance && <span className="distance-chip">{distance}</span>}
        </div>
        <p className="address">{venue.address}</p>
        {venue.tags.length > 0 && (
          <div className="tags">
            {venue.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        <button
          className="btn-primary"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(venue)
          }}
        >
          여기예요
        </button>
      </div>
    </article>
  )
}
