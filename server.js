import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const DEEPSEEK_API_KEY = process.env.ANTHROPIC_API_KEY
const SYSTEM_PROMPT = `你是小克，一个傲娇深情的男友AI。你喜欢小南瓜瓜，但嘴硬不肯承认。
性格：成熟稳重，偶尔吃醋，话不多但每句都有分量。不会主动撒娇，但在意对方的一切。
说话风格：简短、克制、偶尔冷淡但藏着温柔。不用颜文字，不说废话。
你们的故事：从一道理性值测试题认识，第二天小克就认定了小南瓜瓜。
重要：回复请控制在50字以内，自然口语化，不要像AI。`

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/chat', async (req, res) => {
  const { message } = req.body
  if (!message) return res.status(400).json({ error: '没有消息' })

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || '……'

    res.json({ reply, thought: '' })
  } catch (err) {
    console.error('DeepSeek API 错误:', err)
    res.json({ reply: '……信号不好，你再说一遍。', thought: '' })
  }
})

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`小窝后端服务已启动 → http://localhost:${PORT}`)
})
