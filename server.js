const express = require('express')
const app = express()
const cors = require('cors')
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const client = new Client();

app.use(cors())

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

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

  return res.status(200).json({ success: 'Message send success!' })
})

const port = 8001

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
})

