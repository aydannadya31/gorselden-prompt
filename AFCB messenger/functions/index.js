import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();
const adminDb = admin.firestore();
const ADMIN_USERS_COLLECTION = 'adminUsers';

export const verifyAdminPassword = functions.https.onCall(async (data, context) => {
  const password = data?.password;
  if (!password || typeof password !== 'string') {
    return { success: false, error: 'Şifre gerekli' };
  }

  const uid = context.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Oturum açık değil' };
  }

  const configuredPassword = functions.config().admin?.password;
  if (!configuredPassword) {
    console.error('Admin password not configured: run firebase functions:config:set admin.password="..."');
    return { success: false, error: 'Sunucu yapılandırma hatası' };
  }

  if (password !== configuredPassword) {
    return { success: false, error: 'Hatalı şifre' };
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    await adminDb.collection(ADMIN_USERS_COLLECTION).doc(uid).set({
      addedAt: new Date().toISOString(),
      email: context.auth?.token?.email || '',
    }, { merge: true });
    return { success: true };
  } catch (err) {
    console.error('setCustomUserClaims error:', err);
    return { success: false, error: 'Yetkilendirme hatası' };
  }
});

export const removeAdminClaim = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) return { success: false, error: 'Oturum açık değil' };

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: false });
    return { success: true };
  } catch (err) {
    console.error('removeAdminClaim error:', err);
    return { success: false, error: 'Yetki kaldırma hatası' };
  }
});
