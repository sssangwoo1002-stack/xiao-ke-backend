import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json')

const defaults = {
  systemPrompt: '',
  temperature: 0.9,
  maxTokens: 200,
}

export function load() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...defaults, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) }
    }
  } catch {}
  return { ...defaults }
}

export function save(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...load(), ...settings }, null, 2), 'utf-8')
}
