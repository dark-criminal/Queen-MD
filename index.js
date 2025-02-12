const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    jidNormalizedUser,
    Browsers,
    jidDecode,
    makeInMemoryStore
} = require('@darkcriminal/baileys')

const pino = require('pino')
const { Boom } = require('@hapi/boom')

const {
    Queen_Connect,
    Queen_Msg,
    Queen_Data
} = require('queen-md')

const {
    OWNER,
    PREFIX,
    USER_NAME,
    PASSWORD
} = require("./config")

const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})

async function QueenWa() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const queen = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        downloadHistory: false,
        syncFullHistory: false,
    });

    queen.ev.on('creds.update', saveCreds);

    queen.ev.on("connection.update", async (update) => { Queen_Connect(queen, QueenWa, update, jidNormalizedUser, Boom, DisconnectReason, USER_NAME, PASSWORD); })

    queen.ev.on("messages.upsert", async (mek) => { Queen_Msg(queen, mek, PREFIX, OWNER, getContentType); });

    queen.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    Queen_Data(store, queen)
}

QueenWa().catch(console.error);

app.get("/", (req, res) => { res.send("Hello World!"); });
app.listen(port, () => console.log(`Queen-MD Server listening on port http://localhost:8000`));
