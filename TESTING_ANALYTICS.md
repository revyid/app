# Testing Analytics - Quick Guide

## ✅ Build Status: SUCCESS

## 🔍 Cara Test Analytics

### 1. Pastikan Database Setup
```sql
-- Cek apakah table ada
SELECT * FROM analytics_events LIMIT 5;

-- Cek RPC function
SELECT track_event('test', null, 'test-agent', 'test-ip', 'test-ref');
```

### 2. Test di Browser

#### A. Buka Developer Console (F12)
Saat page load, harusnya muncul:
```
Page view tracked successfully
Event tracked: page_view {...}
```

#### B. Cek Network Tab
- Filter: `track_event`
- Harusnya ada request ke Supabase RPC

#### C. Cek Real-time Updates
1. Buka 2 browser/tab berbeda
2. Refresh salah satu
3. Tab lain harusnya auto-update counter (tanpa reload)
4. Console log: "New visitor detected, updating stats..."

### 3. Verifikasi Data di Supabase

```sql
-- Cek total events
SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view';

-- Cek user agents (untuk platform stats)
SELECT user_agent, COUNT(*) 
FROM analytics_events 
WHERE event_type = 'page_view' 
GROUP BY user_agent;

-- Cek hari ini
SELECT COUNT(*) 
FROM analytics_events 
WHERE event_type = 'page_view' 
AND created_at >= CURRENT_DATE;
```

### 4. Test Platform Detection

Buka dari berbagai devices:
- ✅ Windows PC → Harusnya detect "Windows"
- ✅ Mac → Harusnya detect "macOS"
- ✅ Android Phone → Harusnya detect "Android"
- ✅ iPhone → Harusnya detect "iOS"
- ✅ Linux → Harusnya detect "Linux"

### 5. Troubleshooting

#### Jika Counter Masih 0:

**A. Cek RLS Policies:**
```sql
-- Analytics table harus allow public insert
SELECT * FROM pg_policies WHERE tablename = 'analytics_events';
```

**B. Test Manual Insert:**
```sql
INSERT INTO analytics_events (event_type, user_agent, ip_address)
VALUES ('page_view', 'test-agent', 'test-ip');
```

**C. Cek Function Permissions:**
```sql
-- Pastikan anon bisa execute
SELECT has_function_privilege('anon', 'track_event(text, jsonb, text, text, text)', 'execute');
```

#### Jika Real-time Tidak Update:

**A. Cek Supabase Realtime:**
- Dashboard → Settings → API → Realtime enabled?
- Table `analytics_events` di realtime publication?

**B. Cek Browser Console:**
```javascript
// Harusnya ada subscription log
// "New visitor detected, updating stats..."
```

**C. Manual Test:**
```javascript
// Di console
import { trackEvent } from './lib/auth';
await trackEvent('page_view', {}, navigator.userAgent, 'test-ip', 'test');
```

## 📊 Expected Results

### Site Traffic Card:
- **Total**: Semua page views
- **Today**: Views hari ini
- **Unique**: Unique IP addresses

### Platform Stats Card:
- Windows: XX%
- macOS: XX%
- Android: XX%
- iOS: XX%
- Linux: XX%
- Chrome OS: XX%

### Real-time Behavior:
- ✅ Auto-update saat ada visitor baru
- ✅ No page reload needed
- ✅ Console logs untuk debugging
- ✅ Smooth animations

## 🎯 Quick Fix Commands

### Reset Analytics:
```sql
DELETE FROM analytics_events WHERE event_type = 'page_view';
```

### Add Test Data:
```sql
INSERT INTO analytics_events (event_type, user_agent, ip_address, created_at)
VALUES 
  ('page_view', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '192.168.1.1', NOW()),
  ('page_view', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.2', NOW()),
  ('page_view', 'Mozilla/5.0 (Linux; Android 11)', '192.168.1.3', NOW()),
  ('page_view', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', '192.168.1.4', NOW());
```

### Check Realtime:
```sql
-- Enable realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
```

## 🚀 Production Tips

1. **IP Address**: Gunakan service seperti `ipapi.co` atau `ipify.org`
2. **Rate Limiting**: Tambah debounce untuk prevent spam
3. **Privacy**: Jangan simpan full IP, hash atau truncate
4. **Performance**: Add indexes:
   ```sql
   CREATE INDEX idx_analytics_type_date ON analytics_events(event_type, created_at DESC);
   CREATE INDEX idx_analytics_ip ON analytics_events(ip_address);
   ```
