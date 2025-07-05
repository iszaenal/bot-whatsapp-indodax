const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const cron = require('node-cron');

const TARGET_CHAT = 'Signal Cuan ID';

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot WhatsApp siap dan berjalan!');

    // Kirim sinyal setiap 5 menit
    cron.schedule('*/5 * * * *', async () => {
        const pesan = await generateTop10Signal();
        sendMessage(TARGET_CHAT, pesan);
    });

    // Tes kirim sekali saat bot siap
    generateTop10Signal().then(msg => sendMessage(TARGET_CHAT, msg));
});

function sendMessage(chatName, message) {
    client.getChats().then(chats => {
        const target = chats.find(chat => chat.name.toLowerCase() === chatName.toLowerCase());
        if (target) {
            client.sendMessage(target.id._serialized, message);
            console.log(`✅ Pesan dikirim ke "${chatName}"`);
        } else {
            console.log(`❌ Grup "${chatName}" tidak ditemukan.`);
        }
    }).catch(err => {
        console.error('❌ Gagal mengirim pesan:', err.message);
    });
}

async function generateTop10Signal() {
    try {
        const res = await axios.get('https://indodax.com/api/tickers');
        const tickers = res.data.tickers;

        // Daftar 10 koin populer di Indodax
        const topCoins = ['btc_idr', 'eth_idr', 'bnb_idr', 'sol_idr', 'doge_idr', 'ada_idr', 'xrpusdt', 'matic_idr', 'ltc_idr', 'trx_idr'];

        let pesan = `🚨 *Sinyal Premium (Top 10 Coin)*\n🕐 ${new Date().toLocaleTimeString('id-ID')}\n\n`;

        for (const key of topCoins) {
            const data = tickers[key];
            if (!data) continue;

            const nama = key.replace('_idr', '').replace('usdt', '').toUpperCase();
            const last = parseFloat(data.last);
            const high = parseFloat(data.high);
            const low = parseFloat(data.low);
            const open = parseFloat(data.open);
            const diff = last - open;
            const trend = diff >= 0 ? '📈 Naik' : '📉 Turun';
            const persen = ((diff / open) * 100).toFixed(2);
            const posisi = high - low > 0 ? (((last - low) / (high - low)) * 100).toFixed(1) : '0';

            pesan += `🪙 *${nama}*\n`;
            pesan += `💰 Rp ${last.toLocaleString('id-ID')}\n`;
            pesan += `📊 ${trend} (${persen}%) | High: Rp ${high.toLocaleString('id-ID')} | Low: Rp ${low.toLocaleString('id-ID')}\n`;
            pesan += `📌 Posisi: ${posisi}% dari Low → High\n\n`;
        }

        pesan += `🔁 Update otomatis setiap 5 menit\n⚠️ DYOR | Bukan saran finansial`;
        return pesan;

    } catch (err) {
        console.error('❌ Gagal ambil data dari Indodax:', err.message);
        return '⚠️ Gagal ambil data dari Indodax.';
    }
}

client.initialize();
