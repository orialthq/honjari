import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { getDb, isMockMode } from '../firebase'
import { mockCount, mockSubscribe } from '../lib/mockDb'

/**
 * 매장의 실시간 인원 = presence/{venueId}의 자식 개수.
 * 별도 카운터 노드 없이 구독 스냅샷에서 직접 센다.
 */
export function useVenueCount(venueId: string | null): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!venueId) {
      setCount(0)
      return
    }
    if (isMockMode) {
      setCount(mockCount(venueId))
      return mockSubscribe(() => setCount(mockCount(venueId)))
    }
    return onValue(ref(getDb(), `presence/${venueId}`), (snap) => {
      setCount(snap.size)
    })
  }, [venueId])

  return count
}
