export interface Venue {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  photoUrl: string
  tags: string[]
  createdAt: number
}

/** 거리 계산이 끝난 매장. 위치 권한이 없으면 distanceM은 null. */
export interface NearbyVenue extends Venue {
  distanceM: number | null
}
