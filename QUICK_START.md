# Quick Start - Analytics & Profile Header

## ✅ Yang Sudah Ditambahkan

### 1. Admin Panel - Analytics Dashboard
- Tab "Analytics" di Admin Panel
- Menampilkan stats: Total Views, Unique Visitors, Daily Chart, Top Pages, Referrers
- Filter 7/30/90 hari
- Error handling & empty states

### 2. Admin Panel - Profile Header Upload
- Tab "Settings" → Profile Header/Banner section
- Upload image (1920x400px recommended)
- Support Cloudinary atau data URL

### 3. Public Analytics Components
6 komponen real-time untuk ditampilkan di frontend:
- `<GitHubStats />` - GitHub profile stats
- `<VisitorCounter />` - Total visitor counter
- `<LiveActivity />` - Live status indicator
- `<RepoStats />` - Individual repo stats
- `<ContributionGraph />` - Contribution heatmap
- `<PublicAnalytics />` - Complete dashboard

## 🚀 Setup Cepat

### 1. Database
```bash
# Jalankan di Supabase SQL Editor
# File: database-custom-auth.sql (sudah updated)
```

### 2. Gunakan di Frontend

#### Homepage/About Section:
```tsx
import { PublicAnalytics } from '@/components/shared/PublicAnalytics';

function HomePage() {
  return (
    <div>
      {/* Your content */}
      
      {/* GitHub username otomatis dari site settings */}
      <PublicAnalytics />
    </div>
  );
}
```

#### Individual Components:
```tsx
import { 
  GitHubStats, 
  VisitorCounter, 
  LiveActivity 
} from '@/components/shared/PublicAnalytics';

// Di sidebar atau footer
<VisitorCounter />
<LiveActivity />

// Di about section
<GitHubStats username="your-username" />
```

### 3. Track Analytics
```tsx
import { trackEvent } from '@/lib/auth';

// Di useEffect atau event handlers
useEffect(() => {
  trackEvent('page_view', { page: window.location.pathname });
}, []);

// On button click
<button onClick={() => trackEvent('project_click', { project_id: 'xyz' })}>
  View Project
</button>
```

## 📊 Features

### Admin Analytics:
- ✅ Real-time data dari database
- ✅ Visual charts & graphs
- ✅ Time range filtering
- ✅ Empty states & error handling

### Public Analytics:
- ✅ GitHub API integration
- ✅ Real-time visitor counter
- ✅ Live activity indicator
- ✅ Contribution heatmap
- ✅ Repository statistics
- ✅ Responsive design

### Profile Header:
- ✅ Image upload (Cloudinary/data URL)
- ✅ Preview before save
- ✅ Stored in site_settings table
- ✅ Accessible via `getSiteSetting('profile_header')`

## 🎨 Customization

### Styling:
Semua components menggunakan:
- Tailwind CSS classes
- CSS variables (--primary, --muted, dll)
- Responsive design
- Dark mode support

### Data Source:
- Admin analytics: Supabase database
- GitHub stats: GitHub API (public, no auth needed)
- Visitor counter: localStorage (bisa diganti dengan API)

## 📝 Next Steps

1. **Display Profile Header:**
   ```tsx
   const [header, setHeader] = useState('');
   
   useEffect(() => {
     getSiteSetting('profile_header').then(setHeader);
   }, []);
   
   {header && <img src={header} alt="Header" className="w-full h-64 object-cover" />}
   ```

2. **Add More Tracking:**
   - Download CV clicks
   - Social media clicks
   - External link clicks
   - Form submissions

3. **Enhance Public Analytics:**
   - Add more GitHub stats (languages, recent repos)
   - Real-time visitor count via WebSocket
   - Geographic visitor distribution
   - Device/browser statistics
