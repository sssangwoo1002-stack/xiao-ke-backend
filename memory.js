import fs from 'fs'
import path from 'path'

const MEMORY_FILE = path.join(process.cwd(), 'memories.json')
const MAX_RECENT = 15  // 注入对话的最近记忆条数

function load() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

function save(memories) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf-8')
}

// 获取最近 N 条记忆
export function getRecent(limit = MAX_RECENT) {
  const all = load()
  return all.slice(-limit)
}

// 添加一条记忆
export function add(text, category = 'general') {
  const all = load()
  // 去重：相似内容不重复存
  const exists = all.find(m => m.text === text)
  if (exists) return
  all.push({
    id: Date.now(),
    text,
    category,
    timestamp: new Date().toISOString(),
  })
  save(all)
}

// 从对话中提取记忆
export async function extractMemory(userMessage, keReply) {
  const all = load()
  const recentSummary = all.slice(-5).map(m => m.text).join('；')

  const prompt = `用户说："${userMessage}"。提取其中关于用户的事实信息（做了什么、状态、喜好、计划），用"她"开头一句话。必须提取，不许说"无"。`

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '从用户消息中提取个人信息，用"她xxx"格式输出。即使是闲聊也尝试提取。' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 50,
        temperature: 0,
      }),
    })
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || ''
    console.log('记忆提取结果:', text || '(空)')
    if (text && text.length > 3) {
      add(text)
    }
  } catch {
    // 提取失败不影响聊天
  }
}

// 把记忆转成 system prompt 插入文本
export function memoriesToPrompt() {
  const recent = getRecent()
  if (recent.length === 0) return ''
  const lines = recent.map(m => `- ${m.text}`).join('\n')
  return `\n\n你对她最近的记忆：\n${lines}\n\n你可以自然地提及这些事，但不要刻意逐条罗列。`
}
