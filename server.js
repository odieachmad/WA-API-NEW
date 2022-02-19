const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const helmet = require('helmet')
const cors = require('cors')
const fs = require('fs')
const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const app = express()

// Plugins
app.use(express.json())
app.use(morgan('dev'))
app.use(compression())
app.use(helmet())
app.use(cors())

// Configs
const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });
client.initialize()


client.on('qr', (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log('QR RECEIVED', qr);

  qrcode.generate(qr, { small: true })
});

client.on('authenticated', (session) => {
  console.log('AUTHENTICATED', session);
  sessionCfg=session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
      if (err) {
          console.error(err);
      }
  });
});

client.on('auth_failure', msg => {
  // Fired if session restore was unsuccessfull
  console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
  console.log('READY');
});

client.on('message', msg => {
  if (msg.body == '!ping') {
      client.sendMessage(msg.from, 'pong')
  }
});


// Direct endpoints
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server online!' })
})
app.get('/api/v1/otp/:phone/send', async (req, res) => {
  const { phone } = req.params
  const { message } = req.query
  const isPhone = /^(^\+62|62|^08)(\d{3,4}-?){2}\d{3,4}$/g.test(parseInt(phone))

  if(!phone) {
    return res.status(400).json({ error: "Masukkan nomor hp!" })
  } else if(!isPhone) {
    return res.status(400).json({ error: "Nomor hp tidak valid!" })
  }

  const isRegistered = await client.getNumberId(phone)

  if(isRegistered) {
    await client.sendMessage(`${phone}@c.us`, message)
  } else {
    return res.status(400).json({ error: "Nomor tidak terdaftar di whatsapp!" })
  }

  return res.status(200).json({ fialed: 'Message send success!' })
})

// Routes

const port = 8001

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
})