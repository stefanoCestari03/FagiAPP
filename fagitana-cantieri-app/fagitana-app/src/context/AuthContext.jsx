import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Flag "tutorial visto" salvati sull'account (user_metadata di Supabase Auth),
  // così valgono per l'utente su qualsiasi dispositivo e non solo sul browser corrente.
  const hasSeenTutorial = (key) => Boolean(user?.user_metadata?.[key])

  const markTutorialSeen = async (key) => {
    if (!user || hasSeenTutorial(key)) return
    const { data, error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, [key]: true },
    })
    if (!error && data?.user) setUser(data.user)
  }

  const isAdmin = user?.user_metadata?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin, hasSeenTutorial, markTutorialSeen }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
