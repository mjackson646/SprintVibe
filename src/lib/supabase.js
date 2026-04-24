import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('⚠️ Missing Supabase credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { params: { eventsPerSecond: 20 } }
})

export const signUp = (email, password, displayName) =>
  supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })

export const signOut = () => supabase.auth.signOut()
export const getSession = () => supabase.auth.getSession()

export const generateCode = (prefix = 'ROOM') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = prefix + '-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export const createRoom = async (type, hostId) => {
  const code = generateCode(type === 'poker' ? 'POKER' : 'RETRO')
  const { data, error } = await supabase.from('rooms').insert({ code, type, host_id: hostId, phase: 'lobby' }).select().single()
  if (error) throw error
  return data
}

export const findRoom = async (code) => {
  const { data, error } = await supabase.from('rooms').select('*').eq('code', code.toUpperCase()).eq('active', true).single()
  if (error) throw error
  return data
}

export const setPhase = async (roomId, phase) => {
  const { error } = await supabase.from('rooms').update({ phase }).eq('id', roomId)
  if (error) throw error
}

const COLORS = ['#7c3aed','#06d6a0','#ffd166','#ff4d6d','#38bdf8','#fb7185','#a3e635','#f97316']

export const joinRoom = async (roomId, userId, displayName, role = 'participant') => {
  const color  = COLORS[Math.floor(Math.random() * COLORS.length)]
  const avatar = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const { data, error } = await supabase.from('participants')
    .upsert({ room_id: roomId, user_id: userId, display_name: displayName, avatar, color, role, online: true }, { onConflict: 'room_id,user_id' })
    .select().single()
  if (error) throw error
  return data
}

export const leaveRoom = async (roomId, userId) => {
  await supabase.from('participants').update({ online: false }).eq('room_id', roomId).eq('user_id', userId)
}

export const getParticipants = async (roomId) => {
  const { data, error } = await supabase.from('participants').select('*').eq('room_id', roomId).order('joined_at')
  if (error) throw error
  return data
}

export const castPokerVote = async (roomId, ticketId, ticketTitle, userId, displayName, vote) => {
  const { error } = await supabase.from('poker_votes')
    .upsert({ room_id: roomId, ticket_id: ticketId, ticket_title: ticketTitle, user_id: userId, display_name: displayName, vote, revealed: false }, { onConflict: 'room_id,ticket_id,user_id' })
  if (error) throw error
}

export const revealPokerVotes = async (roomId, ticketId) => {
  const { error } = await supabase.from('poker_votes').update({ revealed: true }).eq('room_id', roomId).eq('ticket_id', ticketId)
  if (error) throw error
}

export const getPokerVotes = async (roomId, ticketId) => {
  let query = supabase.from('poker_votes').select('*').eq('room_id', roomId)
  if (ticketId != null) query = query.eq('ticket_id', ticketId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const addRetroNote = async (roomId, columnId, text, userId, displayName) => {
  const { data, error } = await supabase.from('retro_notes')
    .insert({ room_id: roomId, column_id: columnId, text, user_id: userId, display_name: displayName }).select().single()
  if (error) throw error
  return data
}

export const voteRetroNote = async (roomId, noteId, userId) => {
  const { error: vErr } = await supabase.from('retro_vote_records').insert({ room_id: roomId, note_id: noteId, user_id: userId })
  if (vErr) return
  const { data } = await supabase.from('retro_notes').select('votes').eq('id', noteId).single()
  await supabase.from('retro_notes').update({ votes: (data?.votes || 0) + 1 }).eq('id', noteId)
}

export const getRetroNotes = async (roomId) => {
  const { data, error } = await supabase.from('retro_notes').select('*').eq('room_id', roomId).order('created_at')
  if (error) throw error
  return data
}

export const saveStory = async (roomId, story, columnId) => {
  const { error } = await supabase.from('stories').upsert({
    id: story.id, room_id: roomId, title: story.title,
    description: story.description || '', priority: story.priority || 'medium',
    tags: story.tags || [], points: story.points || null, column_id: columnId,
    assignee: story.assignee || null,
  }, { onConflict: 'id' })
  if (error) console.error('saveStory error:', error)
}

export const deleteStory = async (storyId) => {
  const { error } = await supabase.from('stories').delete().eq('id', storyId)
  if (error) throw error
}

export const moveStory = async (storyId, columnId) => {
  const { error } = await supabase.from('stories').update({ column_id: columnId }).eq('id', storyId)
  if (error) console.error('moveStory error:', error)
}

export const scoreStory = async (storyId, points) => {
  const { error } = await supabase.from('stories').update({ points }).eq('id', storyId)
  if (error) console.error('scoreStory error:', error)
}

export const getStories = async (roomId) => {
  const { data, error } = await supabase.from('stories').select('*').eq('room_id', roomId).order('created_at')
  if (error) throw error
  return data || []
}

export const broadcastNotification = async (roomId, event, payload) => {
  await supabase.channel(`notify:${roomId}`).send({ type: 'broadcast', event, payload })
}

export const sendRetroRecap = async ({ to, roomCode, notes, actions, summary }) => {
  const resendKey = import.meta.env.VITE_RESEND_API_KEY
  if (!resendKey) return
  const actionsList = actions.map((a, i) => `${i+1}. ${a}`).join('\n')
  const wentWell = notes.went_well?.map(n => `• ${n.text}`).join('\n') || 'None'
  const improve  = notes.improve?.map(n => `• ${n.text}`).join('\n') || 'None'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'SprintVibe Recaps <recap@sprintvibe.io>',
      to, subject: `Sprint Retro Recap — Room ${roomCode}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#a78bfa">SprintVibe</h1>
        <p>Room: ${roomCode}</p>
        ${summary ? `<p>${summary}</p>` : ''}
        <h3>✅ Went Well</h3><p style="white-space:pre-line">${wentWell}</p>
        <h3>🔧 To Improve</h3><p style="white-space:pre-line">${improve}</p>
        <h3>⚡ Action Items</h3><p style="white-space:pre-line;font-weight:bold">${actionsList}</p>
      </div>`
    })
  })
}
