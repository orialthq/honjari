import { useCallback, useEffect, useRef, useState } from 'react'
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

/** presence + userStatus에 체크인 기록 (CLAUDE.md 2·3단계). 재연결 복구에서도 재사용. */
async function writePresence(uid: string, venueId: string) {
  const db = getDb()

  // 2. presence set + onDisconnect 등록
  const presenceRef = ref(db, `presence/${venueId}/${uid}`)
  await onDisconnect(presenceRef).remove()
  await set(presenceRef, { at: serverTimestamp() })

  // 3. userStatus set + onDisconnect 등록
  const statusRef = ref(db, `userStatus/${uid}`)
  await onDisconnect(statusRef).remove()
  await set(statusRef, { venueId, checkedInAt: serverTimestamp() })
}

/** 내 체크인 상태 + 체크인/아웃 액션. 체크인 순서는 CLAUDE.md의 3단계를 따른다. */
export function usePresence(): PresenceState {
  const [checkedInVenueId, setCheckedInVenueId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // 이번 세션에서 사용자가 의도한 체크인 상태. 서버 상태와 달리 네트워크
  // 단절로 지워지지 않으므로 재연결 복구의 기준으로 쓴다.
  const intendedVenueRef = useRef<string | null>(null)

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

  // 재연결 복구 — 잠깐 끊긴 사이 onDisconnect가 발동해 presence가 지워져도,
  // 체크인 의도가 살아 있으면 2·3단계를 다시 수행해 자동 재체크인한다.
  useEffect(() => {
    if (isMockMode) return

    let unsubscribe: (() => void) | null = null
    let cancelled = false
    ensureAuth().then((user) => {
      if (cancelled) return
      unsubscribe = onValue(ref(getDb(), '.info/connected'), (snap) => {
        if (snap.val() !== true) return
        const venueId = intendedVenueRef.current
        if (!venueId) return
        writePresence(user.uid, venueId).catch((err) =>
          console.error('재체크인 실패:', err),
        )
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

      await writePresence(user.uid, venueId)
      intendedVenueRef.current = venueId
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
    intendedVenueRef.current = null
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
