import { useVenueCount } from '../hooks/useVenueCount'
import { countLabel, distanceLabel } from '../lib/format'
import type { NearbyVenue } from '../types'

interface Props {
  venue: NearbyVenue
  onSelect: (venue: NearbyVenue) => void
}

export function VenueCard({ venue, onSelect }: Props) {
  const count = useVenueCount(venue.id)
  const distance = distanceLabel(venue.distanceM)

  return (
    <div className="venue-card">
      <div className="row">
        <div>
          <h3 className="name">{venue.name}</h3>
          <div className="meta">
            {distance && <span>{distance}</span>}
            <span>{venue.address}</span>
          </div>
        </div>
        <span className={count < 3 ? 'count quiet' : 'count'}>
          {countLabel(count)}
        </span>
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
      <button className="btn-primary" onClick={() => onSelect(venue)}>
        여기예요
      </button>
    </div>
  )
}
