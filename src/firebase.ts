import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, type User } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'

// .env가 비어 있으면 mock 모드 — Firebase 없이 로컬 인메모리 데이터로 동작.
export const isMockMode = !import.meta.env.VITE_FIREBASE_API_KEY

let app: FirebaseApp | null = null

function getApp(): FirebaseApp {
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })
  }
  return app
}

export function getDb(): Database {
  return getDatabase(getApp())
}

/** 익명 로그인 보장. 이미 로그인돼 있으면 기존 유저 반환. */
export async function ensureAuth(): Promise<User> {
  const auth = getAuth(getApp())
  if (auth.currentUser) return auth.currentUser
  const cred = await signInAnonymously(auth)
  return cred.user
}
