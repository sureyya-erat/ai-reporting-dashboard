
const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Nodemailer SMTP Transport Yapılandırması
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // 587 için false, 465 için true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Gmail için 16 haneli App Password
  },
  tls: {
    rejectUnauthorized: false // Bazı ağlarda gerekebilir
  }
});

// Startup'ta SMTP Kontrolü
transporter.verify((error, success) => {
  if (error) {
    console.error('CRITICAL: SMTP Connection Error:', error);
  } else {
    console.log('SUCCESS: SMTP Server is ready to take messages');
  }
});

// TEST ENDPOINT: sureyyaerat@gmail.com'a test gönderir
app.post('/api/email/test', async (req, res) => {
  const { toEmail } = req.body;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(400).json({ 
      error: 'SMTP yapılandırılmadı. Lütfen backend .env dosyasındaki SMTP_USER ve SMTP_PASS alanlarını doldurun.' 
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"InsightStream" <${process.env.SMTP_USER}>`,
      to: toEmail || 'sureyyaerat@gmail.com',
      subject: 'InsightStream SMTP Bağlantı Testi',
      text: 'SMTP bağlantınız başarıyla yapılandırıldı ve test edildi.',
      html: '<b>SMTP Bağlantınız Başarıyla Yapılandırıldı!</b><p>InsightStream üzerinden rapor göndermeye hazırsınız.</p>'
    });
    res.json({ success: true, message: 'Test e-postası başarıyla gönderildi.' });
  } catch (error) {
    res.status(500).json({ error: `E-posta gönderilemedi: ${error.message}` });
  }
});

// REAL SEND ENDPOINT
app.post('/api/email/send', async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Eksik parametreler (to, subject, html).' });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"InsightStream" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ error: `Gönderim hatası: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
