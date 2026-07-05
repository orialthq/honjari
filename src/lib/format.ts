/** 인원 3명 미만은 숫자 대신 "한산함" 라벨. */
export function countLabel(count: number): string {
  return count < 3 ? '한산함' : `${count}명`
}

export function distanceLabel(distanceM: number | null): string | null {
  if (distanceM === null) return null
  if (distanceM < 1000) return `${distanceM}m`
  return `${(distanceM / 1000).toFixed(1)}km`
}
