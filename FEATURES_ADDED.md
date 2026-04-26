# Fitur Baru - Profile Header & Analytics Dashboard

## 🎯 Fitur yang Ditambahkan

### 1. **Profile Header Upload** (Admin Panel)
- Upload banner/cover image untuk profile
- Lokasi: Admin Panel → Settings tab
- Support upload via Cloudinary atau data URL
- Recommended size: 1920x400px
- Tersimpan di database `site_settings` dengan key `profile_header`

### 2. **Real-time Analytics Dashboard** (Admin Panel)
- Tab baru "Analytics" di Admin Panel
- Menampilkan:
  - Total Views (page views)
  - Unique Visitors (berdasarkan IP)
  - Daily Views Chart (grafik bar)
  - Top Pages (halaman paling banyak dikunjungi)
  - Top Referrers (sumber traffic)
- Filter: Last 7/30/90 days
- Data real-time dari database
- Error handling & empty state

### 3. **Public Analytics Components** (Frontend)
Real-time analytics yang bisa ditampilkan di halaman public:

#### **GitHubStats**
- Menampilkan GitHub statistics
- Public repos count
- Followers count
- Auto-fetch dari GitHub API

#### **VisitorCounter**
- Real-time visitor counter
- Persistent count (localStorage)
- Animated display

#### **LiveActivity**
- Live status indicator
- Animated pulse effect
- Shows "Live" or "Updating..."

#### **RepoStats**
- Individual repository statistics
- Stars, Forks, Issues count
- Real-time dari GitHub API

#### **ContributionGraph**
- Visual contribution heatmap
- 52 weeks activity
- Color-coded by intensity

#### **PublicAnalytics**
- Combined dashboard component
- Visitor counter + GitHub stats
- Contribution graph
- Ready to use di homepage

### 4. **Site Settings Enhancement**
- Profile Header/Banner upload
- Site Logo upload
- Favicon upload
- **GitHub Username** (untuk public analytics)
- SEO: Site Title & Description
- Preview section

## 📊 Database Schema Updates

### Tabel Baru:

#### `site_settings`
```sql
- key (text, primary key)
- value (text)
- updated_at (timestamptz)
```

#### `analytics_events`
```sql
- id (uuid)
- event_type (text) -- 'page_view', 'project_click', dll
- event_data (jsonb)
- user_agent (text)
- ip_address (text)
- referrer (text)
- created_at (timestamptz)
```

### RPC Functions Baru:

1. **Site Settings:**
   - `get_site_setting(p_key)` - Public read
   - `update_site_setting(p_token, p_key, p_value)` - Admin only

2. **Analytics:**
   - `track_event(...)` - Public insert
   - `get_analytics_summary(p_token, p_days)` - Admin only

## 🔧 File yang Dimodifikasi/Dibuat

### Database:
- ✅ `database-custom-auth.sql` - Schema & RPC functions

### Backend/API:
- ✅ `src/lib/auth.ts` - Added functions:
  - `getSiteSetting()`
  - `updateSiteSetting()`
  - `trackEvent()`
  - `getAnalyticsSummary()`

### Components:
- ✅ `src/components/admin/AnalyticsDashboard.tsx` - NEW (Fixed with error handling)
- ✅ `src/components/shared/PublicAnalytics.tsx` - NEW (Public real-time stats)
- ✅ `src/components/admin/SiteSettings.tsx` - Updated (added profile header)
- ✅ `src/components/admin/AdminPanel.tsx` - Updated (added Analytics tab)

## 🚀 Cara Menggunakan

### Setup Database:
1. Jalankan SQL di Supabase SQL Editor:
   ```bash
   # Copy isi file database-custom-auth.sql
   # Paste & Execute di Supabase SQL Editor
   ```

2. Verify tables created:
   - `site_settings`
   - `analytics_events`

### Admin Panel:
1. Login sebagai admin
2. Klik icon Shield (Admin Panel)
3. **Settings Tab:**
   - Upload Profile Header (banner)
   - Upload Logo & Favicon
   - **Set GitHub Username** (untuk public stats)
   - Set SEO metadata
   - Click "Save Settings"

4. **Analytics Tab:**
   - View real-time statistics
   - Change time range (7/30/90 days)
   - Monitor traffic & engagement
   - See empty states if no data yet

### Public Analytics (Frontend):

#### 1. GitHub Stats Widget
```tsx
import { GitHubStats } from '@/components/shared/PublicAnalytics';

<GitHubStats username="yourusername" />
```

#### 2. Visitor Counter
```tsx
import { VisitorCounter } from '@/components/shared/PublicAnalytics';

<VisitorCounter />
```

#### 3. Live Activity Indicator
```tsx
import { LiveActivity } from '@/components/shared/PublicAnalytics';

<LiveActivity />
```

#### 4. Repository Stats
```tsx
import { RepoStats } from '@/components/shared/PublicAnalytics';

<RepoStats username="yourusername" repo="your-repo" />
```

#### 5. Contribution Graph
```tsx
import { ContributionGraph } from '@/components/shared/PublicAnalytics';

<ContributionGraph username="yourusername" />
```

#### 6. Complete Public Dashboard
```tsx
import { PublicAnalytics } from '@/components/shared/PublicAnalytics';

// Di homepage atau about section
<PublicAnalytics githubUsername="yourusername" />
```

### Track Events (Frontend):
```typescript
import { trackEvent } from '@/lib/auth';

// Track page view
trackEvent('page_view', { page: window.location.pathname });

// Track project click
trackEvent('project_click', { project_id: 'xyz' });

// Track contact click
trackEvent('contact_click', { type: 'email' });
```

## 🎨 UI/UX Features

### Analytics Dashboard:
- 📊 Visual bar charts untuk daily views
- 🎯 Stats cards dengan icons
- 📱 Responsive design
- ⚡ Real-time data loading
- 🔄 Time range selector

### Site Settings:
- 🖼️ Image preview untuk header/logo/favicon
- 📤 Drag & drop upload support
- 🔗 URL input alternative
- 👁️ Live preview section
- 💾 Batch save all settings

## 🔐 Security

- ✅ RLS policies enabled
- ✅ Admin-only write access
- ✅ Public read for site settings
- ✅ Public insert for analytics (tracking)
- ✅ Token-based authentication
- ✅ SQL injection protection via RPC

## 📝 Notes

- Analytics data disimpan tanpa PII (Personally Identifiable Information)
- IP address hanya untuk unique visitor count
- Profile header bisa digunakan di Hero section atau Profile component
- Cloudinary optional - fallback ke data URL jika tidak dikonfigurasi

## 🔄 Next Steps (Optional)

1. Tambahkan analytics tracking di komponen utama:
   - Hero section (page_view)
   - Project cards (project_click)
   - Contact buttons (contact_click)

2. Display profile header di frontend:
   - Baca dari `getSiteSetting('profile_header')`
   - Tampilkan sebagai banner di Hero/Profile section

3. Add more analytics events:
   - Download CV
   - Social media clicks
   - External link clicks
