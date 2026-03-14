const admin = require("firebase-admin")

let db

try {

if (!admin.apps.length) {

console.log("🔥 Inicializando Firebase Admin")

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined

admin.initializeApp({
credential: admin.credential.cert({
projectId: process.env.FIREBASE_PROJECT_ID,
clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
privateKey: privateKey
})
})

console.log("✅ Firebase inicializado")

}

db = admin.firestore()

console.log("📦 Firestore conectado")

} catch (error) {

console.error("❌ Error inicializando Firebase:", error)

}

module.exports = {
admin,
db
}
