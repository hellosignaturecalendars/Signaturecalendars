import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const uid = process.argv[2];
if (!uid)
  throw Error(
    "Usage: node --env-file=.env.local scripts/grant-admin.mjs FIREBASE_USER_UID",
  );
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log(
  `Admin access assigned to ${uid}. Sign in again to refresh your session.`,
);
