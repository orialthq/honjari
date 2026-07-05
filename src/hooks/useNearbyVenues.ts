import { useCallback, useEffect, useState } from 'react'
import { get, ref } from 'firebase/database'
import { getDb, isMockMode } from '../firebase'
import { MOCK_VENUES } from '../lib/mockDb'
import { haversineM } from '../lib/haversine'
import type { NearbyVenue, Venue } from '../types'

export type LocationStatus = 'loading' | 'ready' | 'denied'

interface NearbyVenuesState {
  venues: NearbyVenue[]
  locationStatus: LocationStatus
  loading: boolean
  error: string | null
  retry: () => void
}

async function fetchVenues(): Promise<Venue[]> {
  if (isMockMode) return MOCK_VENUES
  // 파일럿 매장 5~10개 규모 — 전체 fetch 후 클라이언트에서 거리 계산.
  const snap = await get(ref(getDb(), 'venues'))
  const val = (snap.val() ?? {}) as Record<string, Omit<Venue, 'id'>>
  return Object.entries(val).map(([id, v]) => ({
    id,
    ...v,
    tags: v.tags ?? [],
  }))
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('geolocation unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    })
  })
}

/** 위치 권한 요청 → venues 전체 fetch → Haversine 거리 계산 후 가까운 순 정렬. */
export function useNearbyVenues(): NearbyVenuesState {
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, locationStatus: 'loading' }))
    setAttempt((n) => n + 1)
  }, [])
  const [state, setState] = useState<Omit<NearbyVenuesState, 'retry'>>({
    venues: [],
    locationStatus: 'loading',
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [venuesResult, posResult] = await Promise.allSettled([
        fetchVenues(),
        getPosition(),
      ])
      if (cancelled) return

      if (venuesResult.status === 'rejected') {
        setState({
          venues: [],
          locationStatus: 'denied',
          loading: false,
          error: '매장 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        })
        return
      }

      const here =
        posResult.status === 'fulfilled' ? posResult.value.coords : null
      const venues: NearbyVenue[] = venuesResult.value
        .map((v) => ({
          ...v,
          distanceM: here
            ? haversineM(here.latitude, here.longitude, v.lat, v.lng)
            : null,
        }))
        .sort((a, b) =>
          a.distanceM !== null && b.distanceM !== null
            ? a.distanceM - b.distanceM
            : a.name.localeCompare(b.name, 'ko'),
        )

      setState({
        venues,
        locationStatus: here ? 'ready' : 'denied',
        loading: false,
        error: null,
      })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [attempt])

  return { ...state, retry }
}
