import { useCallback, useEffect, useState } from 'react'
import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
} from 'firebase/database'
import { ensureAuth, getDb, isMockMode } from '../firebase'
import {
  mockCheckIn,
  mockCheckOut,
  mockMyVenueId,
  mockSubscribe,
} from '../lib/mockDb'

interface PresenceState {
  checkedInVenueId: string | null
  busy: boolean
  checkIn: (venueId: string) => Promise<void>
  checkOut: () => Promise<void>
}

/** 내 체크인 상태 + 체크인/아웃 액션. 체크인 순서는 CLAUDE.md의 3단계를 따른다. */
export function usePresence(): PresenceState {
  const [checkedInVenueId, setCheckedInVenueId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 내 userStatus 구독 — onDisconnect로 서버에서 제거되면 UI도 체크아웃 상태로 돌아온다.
  useEffect(() => {
    if (isMockMode) {
      setCheckedInVenueId(mockMyVenueId())
      return mockSubscribe(() => setCheckedInVenueId(mockMyVenueId()))
    }

    let unsubscribe: (() => void) | null = null
    let cancelled = false
    ensureAuth().then((user) => {
      if (cancelled) return
      unsubscribe = onValue(ref(getDb(), `userStatus/${user.uid}`), (snap) => {
        const val = snap.val() as { venueId?: string } | null
        setCheckedInVenueId(val?.venueId ?? null)
      })
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const checkIn = useCallback(async (venueId: string) => {
    if (isMockMode) {
      mockCheckIn(venueId)
      return
    }
    setBusy(true)
    try {
      const user = await ensureAuth()
      const db = getDb()

      // 1. 이전 체크인 확인 → 있으면 이전 매장 presence 명시적 제거
      //    (매장 갈아타기 시에는 onDisconnect가 발동하지 않으므로 필수)
      const prevSnap = await get(ref(db, `userStatus/${user.uid}`))
      const prev = prevSnap.val() as { venueId?: string } | null
      if (prev?.venueId && prev.venueId !== venueId) {
        await remove(ref(db, `presence/${prev.venueId}/${user.uid}`))
      }

      // 2. presence set + onDisconnect 등록
      const presenceRef = ref(db, `presence/${venueId}/${user.uid}`)
      await onDisconnect(presenceRef).remove()
      await set(presenceRef, { at: serverTimestamp() })

      // 3. userStatus set + onDisconnect 등록
      const statusRef = ref(db, `userStatus/${user.uid}`)
      await onDisconnect(statusRef).remove()
      await set(statusRef, { venueId, checkedInAt: serverTimestamp() })
    } finally {
      setBusy(false)
    }
  }, [])

  const checkOut = useCallback(async () => {
    if (isMockMode) {
      mockCheckOut()
      return
    }
    setBusy(true)
    try {
      const user = await ensureAuth()
      const db = getDb()

      const statusRef = ref(db, `userStatus/${user.uid}`)
      const snap = await get(statusRef)
      const status = snap.val() as { venueId?: string } | null

      if (status?.venueId) {
        const presenceRef = ref(db, `presence/${status.venueId}/${user.uid}`)
        await onDisconnect(presenceRef).cancel()
        await remove(presenceRef)
      }
      await onDisconnect(statusRef).cancel()
      await remove(statusRef)
    } finally {
      setBusy(false)
    }
  }, [])

  return { checkedInVenueId, busy, checkIn, checkOut }
}
