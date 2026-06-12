import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase 未配置，使用本地存储')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const TABLES = {
  messages: 'messages',
  sessions: 'sessions',
  memories: 'memories',
  settings: 'settings',
}

// === 会话 ===
export async function createSession(name = '新对话') {
  if (!supabase) return null
  const { data } = await supabase.from(TABLES.sessions).insert({ name }).select('id').single()
  return data?.id
}

export async function getSessions() {
  if (!supabase) return []
  const { data } = await supabase.from(TABLES.sessions).select('*').order('updated_at', { ascending: false })
  return data || []
}

export async function deleteSession(id) {
  if (!supabase) return
  await supabase.from(TABLES.messages).delete().eq('session_id', id)
  await supabase.from(TABLES.sessions).delete().eq('id', id)
}

// === 消息 ===
export async function getMessages(sessionId) {
  if (!supabase) return []
  const { data } = await supabase.from(TABLES.messages).select('*').eq('session_id', sessionId).order('created_at', { ascending: true })
  return data || []
}

export async function saveMessage(sessionId, role, content, thought = '') {
  if (!supabase) return null
  const { data } = await supabase.from(TABLES.messages).insert({
    session_id: sessionId,
    role,
    content,
    thought,
  }).select('id').single()
  // 更新会话时间
  await supabase.from(TABLES.sessions).update({ updated_at: new Date().toISOString() }).eq('id', sessionId)
  return data?.id
}

// === 记忆 ===
export async function getMemories(limit = 15) {
  if (!supabase) return []
  const { data } = await supabase.from(TABLES.memories).select('*').order('created_at', { ascending: false }).limit(limit)
  return (data || []).reverse()
}

export async function addMemory(text) {
  if (!supabase) return
  const { data: existing } = await supabase.from(TABLES.memories).select('id').eq('text', text).single()
  if (existing) return
  await supabase.from(TABLES.memories).insert({ text })
}

// === 设置 ===
export async function getSettings() {
  if (!supabase) return {}
  const { data } = await supabase.from(TABLES.settings).select('*').single()
  return data?.value || {}
}

export async function updateSettings(settingKey, value) {
  if (!supabase) return
  await supabase.from(TABLES.settings).upsert({ key: settingKey, value })
}
