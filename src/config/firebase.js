const admin = require("firebase-admin")

console.log("====================================")
console.log("🔥 FIREBASE INIT START")
console.log("====================================")

let app

try{

 // ======================
 // CHECK ENV VARIABLES
 // ======================

 console.log("Checking environment variables...")

 if(!process.env.FIREBASE_PROJECT_ID){
  console.error("❌ FIREBASE_PROJECT_ID missing")
 }

 if(!process.env.FIREBASE_CLIENT_EMAIL){
  console.error("❌ FIREBASE_CLIENT_EMAIL missing")
 }

 if(!process.env.FIREBASE_PRIVATE_KEY){
  console.error("❌ FIREBASE_PRIVATE_KEY missing")
 }

 console.log("PROJECT ID:",process.env.FIREBASE_PROJECT_ID)
 console.log("CLIENT EMAIL:",process.env.FIREBASE_CLIENT_EMAIL)

 // ======================
 // FORMAT PRIVATE KEY
 // ======================

 let privateKey = process.env.FIREBASE_PRIVATE_KEY

 if(privateKey){
  privateKey = privateKey.replace(/\\n/g,"\n")
 }

 console.log("Private key loaded:", !!privateKey)

 // ======================
 // INIT FIREBASE APP
 // ======================

 if(!admin.apps.length){

  console.log("🚀 Initializing Firebase Admin...")

  app = admin.initializeApp({
   credential: admin.credential.cert({
    projectId:process.env.FIREBASE_PROJECT_ID,
    clientEmail:process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:privateKey
   })
  })

  console.log("✅ Firebase Admin initialized")

 }else{

  console.log("⚠ Firebase already initialized")

  app = admin.app()

 }

}catch(err){

 console.error("🔥 ERROR INITIALIZING FIREBASE")
 console.error(err)

}

// ======================
// FIRESTORE
// ======================

let db

try{

 console.log("📡 Connecting to Firestore...")

 db = admin.firestore()

 console.log("✅ Firestore instance created")

}catch(err){

 console.error("🔥 ERROR CONNECTING FIRESTORE")
 console.error(err)

}

console.log("====================================")
console.log("🔥 FIREBASE INIT COMPLETE")
console.log("====================================")

module.exports = {
 admin,
 db
}
