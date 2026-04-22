import { useState, useEffect, useRef, useCallback } from 'react'
import {
  supabase,
  joinRoom,
  leaveRoom,
  getParticipants,
  getPokerVotes,
  getRetroNotes,
  setPhase,
} from '../lib/supabase'

// ─────────────────────────────────────────────────────────────
//  useRoom  — subscribes to everything in a room in real time
//
//  Usage:
//    const { room, participants, pokerVotes, retroNotes, phase } = useRoom(roomId, userId, displayName)
// ─────────────────────────────────────────────────────────────
export function useRoom(roomId, userId, displayName, role = 'participant') {
  const [room,         setRoom]         = useState(null)
  const [participants, setParticipants] = useState([])
  const [pokerVotes,   setPokerVotes]   = useState([])
  const [retroNotes,   setRetroNotes]   = useState([])
  const [phase,        setPhaseState]   = useState('lobby')
  const [loading,      setLoading]      = useState(true)
  const channelRef = useRef(null)

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !userId) return

    const init = async () => {
      setLoading(true)
      try {
        // Join the room as a participant
        await joinRoom(roomId, userId, displayName, role)

        // Load existing data
        const [parts, votes, notes] = await Promise.all([
          getParticipants(roomId),
          getPokerVotes(roomId, null),   // null = all tickets
          getRetroNotes(roomId),
        ])
        setParticipants(parts)
        setPokerVotes(votes)
        setRetroNotes(notes)

        // Load room phase
        const { data: roomData } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single()
        if (roomData) { setRoom(roomData); setPhaseState(roomData.phase) }

      } catch (err) {
        console.error('Room init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()

    // ── Real-time subscriptions ───────────────────────────
    const channel = supabase
      .channel(`room:${roomId}`)

      // Room phase changes (host advances phases → everyone moves)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms',
        filter: `id=eq.${roomId}`
      }, payload => {
        setRoom(payload.new)
        setPhaseState(payload.new.phase)
      })

      // Someone joins or goes online/offline
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'participants',
        filter: `room_id=eq.${roomId}`
      }, async () => {
        const parts = await getParticipants(roomId)
        setParticipants(parts)
      })

      // Poker vote cast or revealed
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'poker_votes',
        filter: `room_id=eq.${roomId}`
      }, async () => {
        const votes = await getPokerVotes(roomId, null)
        setPokerVotes(votes)
      })

      // Retro note added, updated, or deleted
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'retro_notes',
        filter: `room_id=eq.${roomId}`
      }, async () => {
        const notes = await getRetroNotes(roomId)
        setRetroNotes(notes)
      })

      .subscribe()

    channelRef.current = channel

    // ── Cleanup on unmount ────────────────────────────────
    return () => {
      leaveRoom(roomId, userId)
      supabase.removeChannel(channel)
    }
  }, [roomId, userId, displayName, role])

  // Host can advance the phase for everyone
  const advancePhase = useCallback(async (newPhase) => {
    await setPhase(roomId, newPhase)
  }, [roomId])

  return {
    room,
    participants,
    pokerVotes,
    retroNotes,
    phase,
    loading,
    advancePhase,
    // Helpers to filter votes/notes
    votesForTicket: (ticketId) => pokerVotes.filter(v => v.ticket_id === ticketId),
    notesByColumn:  (colId)    => retroNotes.filter(n => n.column_id === colId),
  }
}

// ─────────────────────────────────────────────────────────────
//  useAuth  — handles login state
// ─────────────────────────────────────────────────────────────
export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for sign in / sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
