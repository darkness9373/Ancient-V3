require('dotenv').config()
const fs = require('fs')

// WORKAROUND: velowa's FileSignalStorage opens the temp file read-only then
// calls fsync on it. On Windows that throws EPERM, which breaks login and
// causes "Connection closed (1006)". Data is already written by writeFileSync,
// so skipping fsync on EPERM is safe.
const _fsyncSync = fs.fsyncSync
fs.fsyncSync = function (fd) {
  try {
    return _fsyncSync.call(fs, fd)
  } catch (err) {
    if (err && err.code === 'EPERM') return
    throw err
  }
}

const { Client, serialize, ProtocolLogger, GroupCache, isAudioSticker, audioStickerSound, ensureStickerWebp } = require('velowa')
const qrcode = require('qrcode-terminal')

const {
  BOT_NUMBER,
  CUSTOM_PAIRING_CODE,
  BOT_NAME,
  OWNER_NUMBER,
  PREFIX = '!',
  ANTIBAN = 'true',
  AUTH_DIR = 'auth',
  LOG_PROTOCOL = 'false',
  STICKER_PACK = BOT_NAME,
  STICKER_AUTHOR = OWNER_NUMBER
} = process.env

const path = require('path')

// Velowa menjalankan "ffmpeg" dari PATH untuk convert sticker.
// ffmpeg-static menyediakan binary-nya; tambahkan foldernya ke PATH.
try {
  const ffmpegPath = require('ffmpeg-static')
  if (ffmpegPath) {
    process.env.PATH = `${path.dirname(ffmpegPath)}${path.delimiter}${process.env.PATH}`
  }
} catch (e) {
  console.warn('ffmpeg-static tidak tersedia:', e.message)
}

// Convert audio ke Opus/OGG (WhatsApp audio sticker butuh format ini)
const { spawn } = require('child_process')
const toOpus = (inputBuffer) => new Promise((resolve, reject) => {
  const ffmpeg = spawn('ffmpeg', [
    '-v', 'error', '-nostdin',
    '-i', 'pipe:0',
    '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on',
    '-f', 'ogg', 'pipe:1'
  ], { stdio: ['pipe', 'pipe', 'pipe'] })
  const chunks = []
  ffmpeg.stdout.on('data', (d) => chunks.push(d))
  ffmpeg.on('error', reject)
  ffmpeg.on('close', (code) => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`ffmpeg exit ${code}`)))
  ffmpeg.stdin.end(inputBuffer)
})

const authPath = path.join(process.env.APPDATA || __dirname, 'dark-unite-bot', AUTH_DIR)
if (!fs.existsSync(authPath)) {
  fs.mkdirSync(authPath, { recursive: true })
}
console.log('Auth path:', authPath)

// Mapping nomor HP <-> LID disimpan velowa di auth/signal/lid-map.json (pn -> lid).
// Kita balik jadi lid -> pn supaya bisa tampilkan nomor HP asli sender LID.
const lidMapPath = path.join(authPath, 'signal', 'lid-map.json')
let lidMapCache = { mtime: 0, reverse: {} }
const getLidReverse = () => {
  try {
    const st = fs.statSync(lidMapPath)
    if (st.mtimeMs !== lidMapCache.mtime) {
      const map = JSON.parse(fs.readFileSync(lidMapPath, 'utf8'))
      const reverse = {}
      for (const [pn, lid] of Object.entries(map)) reverse[lid] = pn
      lidMapCache = { mtime: st.mtimeMs, reverse }
    }
  } catch (e) {
    // file belum ada / belum bisa dibaca: pakai cache lama
  }
  return lidMapCache.reverse
}

const client = new Client({
  authDir: authPath,
  logger: new ProtocolLogger({ enabled: LOG_PROTOCOL === 'true' }),
  pairWithPhoneNumber: BOT_NUMBER,
  customPairingCode: CUSTOM_PAIRING_CODE,
  antiban: ANTIBAN === 'true',
  autoReconnect: true
})

const groups = new GroupCache(client)

// Sesi menunggu nama sticker pack setelah .sticker.
// key: `${chat}|${sender}` -> { buffer, promptId, timer }
const pendingStickers = new Map()
const STICKER_PROMPT_TTL = 120_000 // 2 menit
const MAX_CACHE_BYTES = 32 * 1024 * 1024 // jangan simpan sumber > 32MB

// Sesi menunggu audio untuk .audiosticker
// key: `${chat}|${sender}` -> { stickerBuffer, promptId, timer }
const pendingAudioStickers = new Map()
const AUDIO_STICKER_PROMPT_TTL = 120_000 // 2 menit

const jidNumber = (jid) => (jid ? jid.split('@')[0].split(':')[0] : '')

// Cache audio sticker data by message ID (for .test command)
const audioStickerCache = new Map()
const AUDIO_STICKER_TTL = 5 * 60 * 1000 // 5 menit

// Ambil nomor HP asli sender (sender bisa berupa LID `...@lid`, bukan nomor)
const resolveSenderNumber = async (m) => {
  if (m.sender?.endsWith('@s.whatsapp.net')) return jidNumber(m.sender)
  if (m.sender?.endsWith('@lid')) {
    const pn = getLidReverse()[jidNumber(m.sender)]
    if (pn) return pn
  }
  if (m.isGroup) {
    try {
      const info = await groups.get(m.chat)
      const p = info.participants.find((x) => x.id === m.sender || x.lid === m.sender)
      if (p?.phoneNumber) return jidNumber(p.phoneNumber)
      if (p?.id?.endsWith('@s.whatsapp.net')) return jidNumber(p.id)
    } catch (e) {
      // diamkan, nanti fallback ke LID
    }
  }
  if (m.chat?.endsWith('@s.whatsapp.net')) return jidNumber(m.chat)
  return null
}

// Sumber yang bisa dijadikan sticker: gambar, gif, video, atau sticker
const isStickerSource = (type, mimetype) => {
  if (type && /sticker/i.test(type)) return true
  if (mimetype && /^(image|video)\//i.test(mimetype)) return true
  return false
}

let reconnectAttempts = 0
client.on('close', async (reason) => {
  console.log('Connection closed:', JSON.stringify(reason))
  if (reason?.willReconnect) {
    console.log('Auto-reconnecting...')
    return
  }
  reconnectAttempts++
  if (reconnectAttempts < 5) {
    console.log(`Manual reconnect attempt ${reconnectAttempts}/5 in 5s...`)
    setTimeout(() => client.connect(), 5000)
  } else {
    console.log('Max reconnect attempts reached')
  }
})

client.on('connection', (update) => {
  if (update.qr) {
    console.log('Scan QR code below:')
    qrcode.generate(update.qr, { small: true })
  }
  if (update.pairingCode) {
    console.log(`Pairing code: ${update.pairingCode}`)
    console.log('Enter this code on WhatsApp > Linked devices > Link with phone number')
  }
  if (update.state === 'open') {
    console.log(`✅ ${BOT_NAME} online as ${client.me?.id}`)
  }
  if (update.state === 'close') {
    console.log('❌ Connection closed:', update.reason)
    if (update.loggedOut) {
      console.log('Logged out on phone. Delete auth/ and restart.')
    }
  }
})

const isOwner = (sender) => {
  const senderNum = sender.split('@')[0]
  const ownerNum = OWNER_NUMBER
  return senderNum === ownerNum || senderNum === ownerNum.replace(/^62/, '0')
}

const parseCommand = (text) => {
  const prefixMatch = text.match(new RegExp(`^([${PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}])\\s*(.+)`))
  if (!prefixMatch) return null
  const [, , cmdText] = prefixMatch
  const parts = cmdText.trim().split(/\s+/)
  return {
    command: parts[0].toLowerCase(),
    args: parts.slice(1),
    text: parts.slice(1).join(' ')
  }
}

client.on('message', async (raw) => {
  const m = serialize(client, raw)
  if (m.fromMe) return

  const now = Date.now() / 1000
  if (m.timestamp < now - 120) return

  // Log detail pesan yang dikirim sender
  const time = new Date().toLocaleString('id-ID')
  const senderNumber = await resolveSenderNumber(m)
  const logLines = [
    `\n📩 [${time}] Pesan baru masuk`,
    `   Dari  : ${m.pushName || 'Unknown'} (${m.sender})`,
    `   Nomor : ${senderNumber ? '+' + senderNumber : '(tidak diketahui / LID)'}`,
    `   Chat  : ${m.chat} [${m.isGroup ? 'GROUP' : 'PRIVATE'}]`,
    `   Tipe  : ${m.type}`,
    `   Teks  : ${m.text || '(kosong)'}`
  ]
  if (m.isMedia) logLines.push(`   Media : ${m.mimetype || 'unknown'}`)
  if (m.quoted) logLines.push(`   Reply : ${m.quoted.sender} - ${m.quoted.text || m.quoted.type || 'media'}`)
  logLines.push(`   ID    : ${m.id}`)
  console.log(logLines.join('\n'))

  // Tampilkan seluruh detail JSON dari raw message saat user mengirim sticker/pesan
  console.log('🔍 RAW MESSAGE JSON:\n', JSON.stringify(raw, null, 2))

  // Cache audio sticker data jika ini audio sticker
  if (isAudioSticker(raw.message)) {
    const sound = audioStickerSound(raw.message)
    if (sound?.audioMessage) {
      const prev = audioStickerCache.get(m.id)
      if (prev?.timer) clearTimeout(prev.timer)
      const timer = setTimeout(() => audioStickerCache.delete(m.id), AUDIO_STICKER_TTL)
      audioStickerCache.set(m.id, { audioMessage: sound.audioMessage, timer })
      console.log(`🎵 Audio sticker cached: ${m.id}`)
    }
  }

  const parsed = parseCommand(m.text)

  // Bukan command: cek apakah ini balasan untuk nama sticker pack
  if (!parsed) {
    const key = `${m.chat}|${m.sender}`

    // 1. Balasan untuk audio sticker (minta audio)
    const pendingAudio = pendingAudioStickers.get(key)
    if (pendingAudio && m.quoted?.id === pendingAudio.promptId && m.isMedia) {
      const isAudio = m.type === 'audioMessage' || m.type === 'pttMessage' || (m.mimetype && /^audio\//.test(m.mimetype))
      if (!isAudio) {
        return await m.reply('❌ Bukan audio. Kirim voice note / file audio.')
      }
      await m.markRead().catch(() => {})
      clearTimeout(pendingAudio.timer)
      pendingAudioStickers.delete(key)

      await m.reply('🔄 Menggabungkan sticker + audio...')
      try {
        const audioBuffer = await m.download()
        
        // Convert audio ke Opus/OGG (WhatsApp audio sticker butuh format ini)
        const opusAudio = await toOpus(audioBuffer)
        console.log(`🎵 Audio converted to Opus: ${audioBuffer.length} -> ${opusAudio.length} bytes`)
        
        // Convert sticker ke WebP DULU (PAKAI DEFAULT OPTIONS sama seperti .sticker)
        const webpSticker = await ensureStickerWebp(pendingAudio.stickerBuffer)
        console.log(`🖼️ Sticker converted to WebP: ${pendingAudio.stickerBuffer.length} -> ${webpSticker.length} bytes`)
        
        // Kirim audio sticker dengan WebP yg sudah ready, DISABLE stickerConvert biar ngga di-re-encode
        await client.sendAudioSticker(m.chat, {
          sticker: webpSticker,
          audio: opusAudio
        }, { 
          emojis: '🎵', 
          seconds: Math.floor(opusAudio.length / 5000) || 5,
          stickerConvert: false
        })
        await m.reply('✅ Audio sticker dikirim!')
        console.log('✅ Audio sticker created')
      } catch (e) {
        console.error('Audio sticker error:', e)
        await m.reply('⚠️ Gagal membuat audio sticker: ' + e.message)
      }
      return
    }

    // 2. Balasan untuk nama sticker pack
    const pending = pendingStickers.get(key)
    if (pending && m.quoted?.id === pending.promptId) {
      await m.markRead().catch(() => {})
      const packName = (m.text || '').trim().slice(0, 60)

      if (!packName) {
        return await m.reply('❌ Nama pack kosong. Reply lagi dengan nama pack.')
      }

      clearTimeout(pending.timer)
      pendingStickers.delete(key)
      try {
        const webpSticker = await ensureStickerWebp(pending.buffer)
        await client.sendSticker(m.chat, webpSticker, {
          stickerMetadata: { packName, publisher: STICKER_AUTHOR }
        })
        await m.reply(`✅ Sticker dibuat dengan pack *${packName}*`)
        console.log(`✅ Sticker dibuat, pack="${packName}"`)
      } catch (e) {
        console.error('Sticker error:', e)
        await m.reply('⚠️ Gagal membuat sticker: ' + e.message)
      }
      return
    }
    return
  }

  const { command, args, text } = parsed

  // Tandai pesan dibaca hanya untuk pesan yang akan bot jawab
  await m.markRead().catch((e) => console.error('markRead failed:', e.message))

  try {
    switch (command) {
      case 'ping': {
        const start = Date.now()
        await m.reply('pong')
        const latency = Date.now() - start
        await m.reply(`Latency: ${latency}ms`)
        break
      }

      case 'sticker':
      case 'stiker':
      case 's': {
        await client.sendChatState(m.chat, 'composing').catch(() => {})
        try {
          let buffer = null
          let source = ''

          // 1) Caption pada media yang dikirim langsung
          if (m.isMedia && isStickerSource(m.type, m.mimetype)) {
            buffer = await m.download()
            source = 'media + caption'
          }
          // 2) Reply ke pesan media
          else if (m.quoted && isStickerSource(m.quoted.type, m.quoted.mimetype)) {
            buffer = await m.quoted.download()
            source = 'reply'
          }

          if (!buffer) {
            return await m.reply(
              `🖼️ *Sticker Maker*\n\n` +
                `Cara pakai:\n` +
                `• Kirim gambar/gif/mp4 dengan caption *${PREFIX}sticker*\n` +
                `• Atau reply gambar/gif/mp4 lalu kirim *${PREFIX}sticker*`
            )
          }

          if (buffer.length > MAX_CACHE_BYTES) {
            return await m.reply('❌ Media terlalu besar untuk diproses jadi sticker.')
          }

          console.log(`📥 Sumber sticker siap dari ${source} (${buffer.length} bytes)`)

          // Jangan kirim sticker dulu: tanya nama pack, simpan sumbernya.
          const key = `${m.chat}|${m.sender}`
          const prev = pendingStickers.get(key)
          if (prev?.timer) clearTimeout(prev.timer)

          const promptId = await m.reply(
            `🎨 *Sticker siap dibuat!*\n\n` +
              `Reply pesan ini dengan *nama sticker pack* yang kamu mau.`
          )
          const timer = setTimeout(() => pendingStickers.delete(key), STICKER_PROMPT_TTL)
          pendingStickers.set(key, { buffer, promptId, timer })
        } finally {
          await client.sendChatState(m.chat, 'paused').catch(() => {})
        }
        break
      }

      case 'test': {
        if (!m.quoted?.key?.id) {
          return await m.reply('❌ Reply ke sticker!')
        }

        // Cari audio sticker di cache pakai ID pesan yg di-reply
        const cached = audioStickerCache.get(m.quoted.key.id)
        if (!cached?.audioMessage) {
          return await m.reply('❌ Audio sticker tidak ditemukan di cache (mungkin expired atau bukan audio sticker).')
        }

        const sticker = await m.quoted.download()
        const audio = await client.downloadMedia({ audioMessage: cached.audioMessage })

        await m.reply('🔄 Memproses...')
        
        // 1. Kirim sticker biasa (tanpa audio)
        await client.sendSticker(m.chat, sticker)
        
        // 2. Kirim audio opus
        if (audio) {
          await client.sendAudio(m.chat, audio, { ptt: true, seconds: 5 })
        } else {
          await m.reply('⚠️ Gagal download audio.')
        }
        break
      }

      case 'audiosticker':
      case 'asticker': {
        if (!m.quoted || !isStickerSource(m.quoted.type, m.quoted.mimetype)) {
          return await m.reply(
            `🎵 *Audio Sticker Maker*\n\n` +
              `Cara pakai:\n` +
              `• Reply ke *gif/mp4/sticker animated* dengan *${PREFIX}audiosticker*\n` +
              `• Lalu bot akan minta audio, *reply pesan bot* dengan voice note/audio`
          )
        }

        const stickerBuffer = await m.quoted.download()

        if (stickerBuffer.length > MAX_CACHE_BYTES) {
          return await m.reply('❌ Media terlalu besar.')
        }

        const key = `${m.chat}|${m.sender}`
        const prev = pendingAudioStickers.get(key)
        if (prev?.timer) clearTimeout(prev.timer)

        const promptId = await m.reply(
          `🎵 *Siap membuat Audio Sticker!*\n\n` +
            `Sekarang kirim *voice note / audio* (reply pesan ini).\n` +
            `Format: OGG Opus / MP3 / M4A`
        )
        const timer = setTimeout(() => pendingAudioStickers.delete(key), AUDIO_STICKER_PROMPT_TTL)
        pendingAudioStickers.set(key, { stickerBuffer, promptId, timer })
        break
      }

      case 'help': {
        const helpText = `📋 *${BOT_NAME} - Command List*

*${PREFIX}ping* - Cek latency bot
*${PREFIX}sticker* - Buat sticker dari gambar/gif/video
*${PREFIX}audiosticker* - Buat audio sticker (sticker + suara)
*${PREFIX}test* - Pisah audio sticker (sticker + audio terpisah)
*${PREFIX}help* - Tampilkan menu ini
*${PREFIX}info* - Info bot
*${PREFIX}owner* - Info owner

${isOwner(m.sender) ? `*Owner Only:*
${PREFIX}restart - Restart bot
${PREFIX}broadcast <pesan> - Broadcast ke semua chat` : ''}`
        await m.reply(helpText)
        break
      }

      case 'info': {
        const uptime = process.uptime()
        const hours = Math.floor(uptime / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)
        const seconds = Math.floor(uptime % 60)

        const infoText = `ℹ️ *${BOT_NAME} Info*

*Bot:* ${BOT_NAME}
*Number:* ${client.me?.id || 'Unknown'}
*Library:* velowa
*Runtime:* Node.js ${process.version}
*Uptime:* ${hours}h ${minutes}m ${seconds}s
*Memory:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
*Prefix:* ${PREFIX}
*Antiban:* ${ANTIBAN === 'true' ? 'Enabled' : 'Disabled'}`
        await m.reply(infoText)
        break
      }

      case 'owner': {
        await m.reply(`👑 *Owner Info*
Number: ${OWNER_NUMBER}
Bot: ${BOT_NAME}`)
        break
      }

      case 'restart': {
        if (!isOwner(m.sender)) return await m.reply('❌ Owner only!')
        await m.reply('🔄 Restarting...')
        process.exit(0)
        break
      }

      case 'broadcast': {
        if (!isOwner(m.sender)) return await m.reply('❌ Owner only!')
        if (!text) return await m.reply('Usage: !broadcast <pesan>')
        await m.reply(`📢 Broadcast: ${text}`)
        break
      }

      default:
        await m.reply(`❓ Unknown command: ${command}\nKetik ${PREFIX}help untuk bantuan`)
    }
  } catch (err) {
    console.error('Command error:', err)
    await m.reply('⚠️ Terjadi kesalahan saat menjalankan command')
  }
})

process.on('SIGINT', async () => {
  console.log('\nShutting down...')
  await client.logout()
  process.exit(0)
})

;(async () => {
  await client.connect()
})()
