// Shows the CRM's notifications and sets the number on the app icon, even when the app is closed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let p = {}; try { p = e.data ? e.data.json() : {}; } catch (x) {}
  const d = p.data || p, n = d.badge != null && d.badge !== '' ? Number(d.badge) : null;
  const jobs = [self.registration.showNotification(d.title || 'CRM', { body: d.body || '', icon: 'icon-192.png', tag: d.tag || undefined, renotify: !!d.tag, data: { url: './' } })];
  if (n != null && self.navigator.setAppBadge) jobs.push((n ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge()).catch(() => {}));
  e.waitUntil(Promise.all(jobs));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { for (const c of list) { if ('focus' in c) return c.focus(); } return self.clients.openWindow('./'); }));
});