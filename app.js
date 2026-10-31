// Phone app shell for the CRM: shows the CRM, asks to allow notifications, and passes this phone's notification
// address to the CRM (only to the CRM's own Google page) so it can notify whoever is signed in here.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getMessaging, getToken, isSupported } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js';
const FB = {"apiKey":"AIzaSyDn7Dt8uTOlFY-A__sE9faZITvPEhTW9VI","authDomain":"ensign-crm.firebaseapp.com","projectId":"ensign-crm","storageBucket":"ensign-crm.firebasestorage.app","messagingSenderId":"841438365281","appId":"1:841438365281:web:c9b7606ac9c7f4a1cccc20"}, VAPID = 'BChFpJYjIKgowceYXIEWMoswlX2dKdZ3LmT9KXbz9P7MSnIP-M7NLOTBspJybt__HKQ0PJnlwvLoTLMOjwNeJtE';
const $ = id => document.getElementById(id), bar = $('bar');
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let crm = null, crmOrigin = '', token = '', reg = null, messaging = null;
const tell = m => { if (crm) crm.postMessage(Object.assign({ ensignShell: 1 }, m), crmOrigin); };
const perm = () => ('Notification' in window ? Notification.permission : 'unsupported');
function show(text, ask) { $('barText').textContent = text; $('barGo').style.display = ask ? '' : 'none'; bar.style.display = 'flex'; }
const hide = () => { bar.style.display = 'none'; };
const later = () => { try { return Date.now() - Number(localStorage.getItem('pushLater') || 0) < 3 * 864e5; } catch (e) { return false; } };
$('barX').onclick = () => { try { localStorage.setItem('pushLater', String(Date.now())); } catch (e) {} hide(); };
async function getMyToken() {
  try { token = await getToken(messaging, { vapidKey: VAPID, serviceWorkerRegistration: reg }); if (token) tell({ type: 'token', token: token, device: device() }); }
  catch (e) { console.log('Notifications: ' + e.message); show('Couldn\'t turn on notifications: ' + e.message, false); }
}
const device = () => (/iphone/i.test(navigator.userAgent) ? 'iPhone' : /ipad/i.test(navigator.userAgent) ? 'iPad' : /android/i.test(navigator.userAgent) ? 'Android phone' : 'Computer');
$('barGo').onclick = async () => {
  const p = await Notification.requestPermission(); hide();
  if (p === 'granted') await getMyToken(); else show('Notifications are blocked. Allow them for this app in the phone\'s settings.', false);
};
async function start() {
  if (!('serviceWorker' in navigator)) return;
  reg = await navigator.serviceWorker.register('sw.js');
  const ok = 'Notification' in window && 'PushManager' in window && await isSupported().catch(() => false);
  if (!ok) { if (ios && !standalone && !later()) show('For notifications on iPhone: tap Share, then Add to Home Screen, and open the app from the icon.', false); return; }
  messaging = getMessaging(initializeApp(FB));
  if (perm() === 'granted') await getMyToken();
  else if (perm() === 'default' && !later()) show('Get a notification when follow-ups are due.', true);
}
window.addEventListener('message', e => {
  const d = e.data; let host = '';
  try { host = new URL(e.origin).hostname; } catch (x) { return; }
  if (!d || d.ensignCrm !== 1 || !(e.origin === location.origin || /(^|\.)googleusercontent\.com$/.test(host))) return;   // only the CRM itself
  crm = e.source; crmOrigin = e.origin;
  if (d.type === 'hello') { tell({ type: 'state', perm: perm(), standalone: standalone }); if (token) tell({ type: 'token', token: token, device: device() }); }
  if (d.type === 'badge' && 'setAppBadge' in navigator) { const n = Number(d.n) || 0; (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {}); }
  if (d.type === 'ask' && perm() === 'default') show('Get a notification when follow-ups are due.', true);
});
// the CRM's screens now run in this same page: talk to it directly (an older app showed it in a frame)
if (window.CRM_SHELL) { crm = window; crmOrigin = location.origin; }
start().then(() => { if (window.CRM_SHELL) tell({ type: 'state', perm: perm(), standalone: standalone }); });