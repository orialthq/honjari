// Firebase 미연결 시(.env 비어 있음) 사용하는 인메모리 mock 스토어.
// seed/venues.json을 그대로 매장 데이터로 쓰므로 실제 RTDB 임포트 결과와 동일하게 보인다.
import seedVenues from '../../seed/venues.json'
import type { Venue } from '../types'

export const MOCK_VENUES: Venue[] = Object.entries(seedVenues).map(
  ([id, v]) => ({ id, ...v }),
)

// 데모용 기본 인원(다른 손님들). 내 체크인은 여기에 +1로 반영된다.
const baseCounts: Record<string, number> = {
  'hongdae-dansang': 5,
  'euljiro-nokturn': 2,
  'mangwon-jari': 0,
}

let myVenueId: string | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function mockSubscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function mockCount(venueId: string): number {
  return (baseCounts[venueId] ?? 0) + (myVenueId === venueId ? 1 : 0)
}

export function mockMyVenueId(): string | null {
  return myVenueId
}

export function mockCheckIn(venueId: string) {
  myVenueId = venueId
  emit()
}

export function mockCheckOut() {
  myVenueId = null
  emit()
}
