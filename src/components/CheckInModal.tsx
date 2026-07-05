import type { NearbyVenue } from '../types'

interface Props {
  venue: NearbyVenue
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function CheckInModal({ venue, busy, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <img src={venue.photoUrl} alt={venue.name} />
        <h2>{venue.name} 맞으세요?</h2>
        <p className="hint">체크인하면 실시간 인원에 포함돼요</p>
        <div className="actions">
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>
            아니에요
          </button>
          <button className="btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? '체크인 중…' : '체크인'}
          </button>
        </div>
      </div>
    </div>
  )
}
