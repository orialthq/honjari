import { useVenueCount } from '../hooks/useVenueCount'
import { countLabel } from '../lib/format'
import type { Venue } from '../types'

interface Props {
  venueId: string
  venue: Venue | null // venues 로딩 전이면 null일 수 있음
  busy: boolean
  onCheckOut: () => void
}

export function CheckedInScreen({ venueId, venue, busy, onCheckOut }: Props) {
  const count = useVenueCount(venueId)

  return (
    <div className="checked-in">
      {venue && <img className="photo" src={venue.photoUrl} alt={venue.name} />}
      <div>
        <h2 className="venue-name">{venue?.name ?? '체크인한 매장'}</h2>
        {venue && <p className="address">{venue.address}</p>}
      </div>
      {venue && venue.tags.length > 0 && (
        <div className="tags">
          {venue.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="live-count">
        <div className="value">{countLabel(count)}</div>
        <div className="label">지금 이 매장에 있는 사람</div>
      </div>
      <p className="auto-checkout-hint">
        앱을 끄거나 자리를 뜨면 자동으로 체크아웃돼요
      </p>
      <button className="btn-danger" onClick={onCheckOut} disabled={busy}>
        {busy ? '체크아웃 중…' : '체크아웃'}
      </button>
    </div>
  )
}
