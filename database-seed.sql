-- ============================================
-- PORTFOLIO DATA BACKUP
-- Run this in Supabase SQL Editor to seed initial data
-- ============================================

INSERT INTO public.portfolio_data (section, data) VALUES
('profile', $${"name":"Revy","pronouns":"he/him","verified":true,"image":"https://scontent.fdjb3-1.fna.fbcdn.net/v/t1.15752-9/643924451_1568867384412033_1644968556563542165_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=fc17b8&efg=eyJxZV9ncm91cHMiOlsiaWdkX2Jlc3RfZWZmb3J0X2ltYWdlOmNvbnRyb2wiXX0%3D&_nc_ohc=EnT2yurEBykQ7kNvwGa2RWR&_nc_oc=AdnEKoxUJMz3LJ6CP5JTHsVUubuCAAMI4dCBT2q9zhWTIYDjKzg5PJRHu5gWiVB8VJA&_nc_zt=23&_nc_ht=scontent.fdjb3-1.fna&_nc_ss=8&oh=03_Q7cD4wGbnq5XFiQKnZZTUqmQeQrRU5TtA6XE02qKxye2_JtUkQ&oe=69D48A14","about":"I am a full-stack software engineer with 2+ years of experience in building web and mobile apps.","easter_egg":{"name":"Nawa","image":"https://scontent.fdjb3-1.fna.fbcdn.net/v/t1.15752-9/643892106_926933829985513_7748531435417713772_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=fc17b8&efg=eyJxZV9ncm91cHMiOlsiaWdkX2Jlc3RfZWZmb3J0X2ltYWdlOmNvbnRyb2wiXX0%3D&_nc_ohc=Kliq_MHYy6sQ7kNvwHQM6ov&_nc_oc=Admw9dFPV-V2sGmH0OzBo-5ISIRpSAuZtNHvt5o5aWuUQ9ZzKbtS2xjU5ZoLPoFgtIY&_nc_zt=23&_nc_ht=scontent.fdjb3-1.fna&_nc_ss=8&oh=03_Q7cD4wFYXQP0S0TYmcp7wYXE2bqHubFkQaRahWbwsuJ6mGdUZg&oe=69D4F2B1","shortcut":"Ctrl+Alt+L"}}$$)
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('intro', $${"paragraphs":["I'm Revy, a software engineer from Jambi, Indonesia. My expertise lies in developing innovative and user-focused products for both web and mobile platforms, where I emphasize intuitive design and robust functionality.","Holding a Master's degree in Computer Science from the Senior High School 1 Bungo, my journey began in a dynamic startup, progressing to lead positions in established tech firms."]}$$)
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('skills', '["JavaScript","React","Python","Git","CI/CD","Node.js","Docker","MongoDB","Typescript"]')
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('languages', '[
  {"name": "Indonesia", "flag": "🇮🇩"},
  {"name": "English", "flag": "🇬🇧"}
]')
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('social_links', '[
  {"platform": "X", "href": "https://x.com", "icon": "Twitter"},
  {"platform": "Threads", "href": "https://threads.net", "icon": "AtSign"},
  {"platform": "Instagram", "href": "https://instagram.com/revy.id", "icon": "Instagram"},
  {"platform": "LinkedIn", "href": "https://linkedin.com", "icon": "Linkedin"},
  {"platform": "GitHub", "href": "https://github.com/revyid", "icon": "Github"},
  {"platform": "YouTube", "href": "https://youtube.com", "icon": "Youtube"}
]')
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('contacts', '[
  {"id": "1", "type": "email", "label": "revy8k@gmail.com", "value": "revy8k@gmail.com", "href": "mailto:revy8k@gmail.com", "icon": "Mail"},
  {"id": "2", "type": "website", "label": "revy.my.id", "value": "revy.my.id", "href": "https://revy.my.id", "icon": "Globe"},
  {"id": "3", "type": "phone", "label": "+62 812-3456-7890", "value": "+62 812-3456-7890", "href": "tel:+6281234567890", "icon": "Phone"}
]')
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('projects', '[
  {
    "id": "1",
    "title": "Redeploy",
    "date": "Feb 24, 2026",
    "role": "Fullstack Developer",
    "category": "Developer Tools",
    "color": "#cf00b3ff",
    "icon": "LayoutDashboard",
    "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    "href": "https://deploy.revy.my.id",
    "description": "A self-hosted deployment platform for managing and deploying web applications with ease.",
    "techStack": ["React", "Node.js", "Docker", "Nginx"],
    "features": ["One-click deploy", "Real-time logs", "Custom domains", "SSL auto-provision"],
    "status": "live",
    "repoUrl": ""
  },
  {
    "id": "2",
    "title": "Redeploy CLI",
    "date": "Mar 15, 2024",
    "role": "Backend / CLI Developer",
    "category": "DevOps Tool",
    "color": "#A78BFA",
    "icon": "Terminal",
    "thumbnail": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80",
    "href": "https://github.com/revyid/redeploy-cli",
    "description": "Command-line interface for interacting with the Redeploy platform from your terminal.",
    "techStack": ["Go", "Cobra CLI", "REST API"],
    "features": ["Deploy from terminal", "Manage services", "View logs", "Environment management"],
    "status": "live",
    "repoUrl": "https://github.com/revyid/redeploy-cli"
  },
  {
    "id": "3",
    "title": "REArch",
    "date": "Mar 30, 2024",
    "role": "Fullstack Developer",
    "category": "Web Application, Linux System",
    "color": "#86EFAC",
    "icon": "Globe",
    "thumbnail": "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80",
    "href": "https://arch.revy.my.id",
    "description": "A web-based Arch Linux system manager for remote administration and monitoring.",
    "techStack": ["React", "Python", "FastAPI", "WebSocket"],
    "features": ["System monitoring", "Package management", "Service control", "Real-time stats"],
    "status": "live",
    "repoUrl": ""
  },
  {
    "id": "4",
    "title": "IP Geolocation",
    "date": "Jan 12, 2024",
    "role": "Fullstack Developer",
    "category": "Web Application",
    "color": "#86EFAC",
    "icon": "Globe",
    "thumbnail": "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80",
    "href": "https://ipgeo.revy.my.id",
    "description": "Fast and accurate IP geolocation lookup tool with detailed network information.",
    "techStack": ["React", "Node.js", "MaxMind GeoIP"],
    "features": ["IP lookup", "Map visualization", "ISP info", "Bulk lookup"],
    "status": "live",
    "repoUrl": ""
  }
]')
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('experiences', '[
  {
    "id": "1",
    "title": "Frontend Lead",
    "company": "Alpha",
    "location": "Cupertino, CA",
    "dateRange": "Jan 24 - Present",
    "description": "Spearheaded the development of a suite of progressive web applications using React and Swift, and GraphQL.",
    "logoColor": "#DC2626"
  },
  {
    "id": "2",
    "title": "Frontend Engineer",
    "company": "Sigma",
    "location": "New York, NY",
    "dateRange": "Sep 22 - Dec 23",
    "description": "Enhanced user interfaces for the Sigma Web Player using React and Redux, achieving a 25% increase in user engagement.",
    "logoColor": "#22C55E"
  }
]')
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.portfolio_data (section, data) VALUES
('education', '[
  {"id": "1", "institution": "Nova University of Science and Technology", "degree": "Master of Science in Computer Science", "year": "2015 - 2016"},
  {"id": "2", "institution": "Brooklyn Institute of Technology", "degree": "Bachelor of Science in Software Engineering", "year": "2011 - 2015"},
  {"id": "3", "institution": "Meta", "degree": "Advanced Frontend Architecture Certification", "year": "2022"},
  {"id": "4", "institution": "Le Wagon", "degree": "Full Stack Web Development Certification", "year": "2017"},
  {"id": "5", "institution": "Google", "degree": "UX Design Professional Certificate", "year": "2019"},
  {"id": "6", "institution": "Amazon Web Services", "degree": "AWS Certified Solutions Architect", "year": "2020"}
]')
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ============================================
-- THEMES DATA
-- ============================================
INSERT INTO public.portfolio_data (section, data) VALUES
('themes', $$[{"id":"material-theme","name":"Blue Calm","seed":"#7794EA","schemes":{"light":{"primary":"#4A5C92","surfaceTint":"#4A5C92","onPrimary":"#FFFFFF","primaryContainer":"#DBE1FF","onPrimaryContainer":"#324478","secondary":"#585E72","onSecondary":"#FFFFFF","secondaryContainer":"#DDE1F9","onSecondaryContainer":"#414659","tertiary":"#745471","onTertiary":"#FFFFFF","tertiaryContainer":"#FFD6F8","onTertiaryContainer":"#5A3D58","error":"#BA1A1A","onError":"#FFFFFF","errorContainer":"#FFDAD6","onErrorContainer":"#93000A","background":"#FAF8FF","onBackground":"#1A1B21","surface":"#FAF8FF","onSurface":"#1A1B21","surfaceVariant":"#E2E2EC","onSurfaceVariant":"#45464F","outline":"#757680","outlineVariant":"#C5C6D0","shadow":"#000000","scrim":"#000000","inverseSurface":"#2F3036","inverseOnSurface":"#F1F0F7","inversePrimary":"#B4C5FF","primaryFixed":"#DBE1FF","onPrimaryFixed":"#00174A","primaryFixedDim":"#B4C5FF","onPrimaryFixedVariant":"#324478","secondaryFixed":"#DDE1F9","onSecondaryFixed":"#151B2C","secondaryFixedDim":"#C1C6DD","onSecondaryFixedVariant":"#414659","tertiaryFixed":"#FFD6F8","onTertiaryFixed":"#2B122B","tertiaryFixedDim":"#E2BBDC","onTertiaryFixedVariant":"#5A3D58","surfaceDim":"#DAD9E0","surfaceBright":"#FAF8FF","surfaceContainerLowest":"#FFFFFF","surfaceContainerLow":"#F4F3FA","surfaceContainer":"#EEEDF4","surfaceContainerHigh":"#E8E7EF","surfaceContainerHighest":"#E3E2E9"},"dark":{"primary":"#B4C5FF","surfaceTint":"#B4C5FF","onPrimary":"#1A2E60","primaryContainer":"#324478","onPrimaryContainer":"#DBE1FF","secondary":"#C1C6DD","onSecondary":"#2A3042","secondaryContainer":"#414659","onSecondaryContainer":"#DDE1F9","tertiary":"#E2BBDC","onTertiary":"#422741","tertiaryContainer":"#5A3D58","onTertiaryContainer":"#FFD6F8","error":"#FFB4AB","onError":"#690005","errorContainer":"#93000A","onErrorContainer":"#FFDAD6","background":"#121318","onBackground":"#E3E2E9","surface":"#121318","onSurface":"#E3E2E9","surfaceVariant":"#45464F","onSurfaceVariant":"#C5C6D0","outline":"#8F909A","outlineVariant":"#45464F","shadow":"#000000","scrim":"#000000","inverseSurface":"#E3E2E9","inverseOnSurface":"#2F3036","inversePrimary":"#4A5C92","primaryFixed":"#DBE1FF","onPrimaryFixed":"#00174A","primaryFixedDim":"#B4C5FF","onPrimaryFixedVariant":"#324478","secondaryFixed":"#DDE1F9","onSecondaryFixed":"#151B2C","secondaryFixedDim":"#C1C6DD","onSecondaryFixedVariant":"#414659","tertiaryFixed":"#FFD6F8","onTertiaryFixed":"#2B122B","tertiaryFixedDim":"#E2BBDC","onTertiaryFixedVariant":"#5A3D58","surfaceDim":"#121318","surfaceBright":"#38393F","surfaceContainerLowest":"#0D0E13","surfaceContainerLow":"#1A1B21","surfaceContainer":"#1E1F25","surfaceContainerHigh":"#292A2F","surfaceContainerHighest":"#33343A"}}},{"id":"material-theme-alt","name":"Green Forest","seed":"#63A002","schemes":{"light":{"primary":"#4C662B","surfaceTint":"#4C662B","onPrimary":"#FFFFFF","primaryContainer":"#CDEDA3","onPrimaryContainer":"#354E16","secondary":"#586249","onSecondary":"#FFFFFF","secondaryContainer":"#DCE7C8","onSecondaryContainer":"#404A33","tertiary":"#386663","onTertiary":"#FFFFFF","tertiaryContainer":"#BCECE7","onTertiaryContainer":"#1F4E4B","error":"#BA1A1A","onError":"#FFFFFF","errorContainer":"#FFDAD6","onErrorContainer":"#93000A","background":"#F9FAEF","onBackground":"#1A1C16","surface":"#F9FAEF","onSurface":"#1A1C16","surfaceVariant":"#E1E4D5","onSurfaceVariant":"#44483D","outline":"#75796C","outlineVariant":"#C5C8BA","shadow":"#000000","scrim":"#000000","inverseSurface":"#2F312A","inverseOnSurface":"#F1F2E6","inversePrimary":"#B1D18A","primaryFixed":"#CDEDA3","onPrimaryFixed":"#102000","primaryFixedDim":"#B1D18A","onPrimaryFixedVariant":"#354E16","secondaryFixed":"#DCE7C8","onSecondaryFixed":"#151E0B","secondaryFixedDim":"#BFCBAD","onSecondaryFixedVariant":"#404A33","tertiaryFixed":"#BCECE7","onTertiaryFixed":"#00201E","tertiaryFixedDim":"#A0D0CB","onTertiaryFixedVariant":"#1F4E4B","surfaceDim":"#DADBD0","surfaceBright":"#F9FAEF","surfaceContainerLowest":"#FFFFFF","surfaceContainerLow":"#F3F4E9","surfaceContainer":"#EEEFE3","surfaceContainerHigh":"#E8E9DE","surfaceContainerHighest":"#E2E3D8"},"dark":{"primary":"#B1D18A","surfaceTint":"#B1D18A","onPrimary":"#1F3701","primaryContainer":"#354E16","onPrimaryContainer":"#CDEDA3","secondary":"#BFCBAD","onSecondary":"#2A331E","secondaryContainer":"#404A33","onSecondaryContainer":"#DCE7C8","tertiary":"#A0D0CB","onTertiary":"#003735","tertiaryContainer":"#1F4E4B","onTertiaryContainer":"#BCECE7","error":"#FFB4AB","onError":"#690005","errorContainer":"#93000A","onErrorContainer":"#FFDAD6","background":"#12140E","onBackground":"#E2E3D8","surface":"#12140E","onSurface":"#E2E3D8","surfaceVariant":"#44483D","onSurfaceVariant":"#C5C8BA","outline":"#8F9285","outlineVariant":"#44483D","shadow":"#000000","scrim":"#000000","inverseSurface":"#E2E3D8","inverseOnSurface":"#2F312A","inversePrimary":"#4C662B","primaryFixed":"#CDEDA3","onPrimaryFixed":"#102000","primaryFixedDim":"#B1D18A","onPrimaryFixedVariant":"#354E16","secondaryFixed":"#DCE7C8","onSecondaryFixed":"#151E0B","secondaryFixedDim":"#BFCBAD","onSecondaryFixedVariant":"#404A33","tertiaryFixed":"#BCECE7","onTertiaryFixed":"#00201E","tertiaryFixedDim":"#A0D0CB","onTertiaryFixedVariant":"#1F4E4B","surfaceDim":"#12140E","surfaceBright":"#383A32","surfaceContainerLowest":"#0C0F09","surfaceContainerLow":"#1A1C16","surfaceContainer":"#1E201A","surfaceContainerHigh":"#282B24","surfaceContainerHighest":"#33362E"}}},{"id":"material-theme-2","name":"Yellow Sun","seed":"#FFDE3F","schemes":{"light":{"primary":"#6D5E0F","surfaceTint":"#6D5E0F","onPrimary":"#FFFFFF","primaryContainer":"#F8E287","onPrimaryContainer":"#534600","secondary":"#665E40","onSecondary":"#FFFFFF","secondaryContainer":"#EEE2BC","onSecondaryContainer":"#4E472A","tertiary":"#43664E","onTertiary":"#FFFFFF","tertiaryContainer":"#C5ECCE","onTertiaryContainer":"#2C4E38","error":"#BA1A1A","onError":"#FFFFFF","errorContainer":"#FFDAD6","onErrorContainer":"#93000A","background":"#FFF9EE","onBackground":"#1E1B13","surface":"#FFF9EE","onSurface":"#1E1B13","surfaceVariant":"#EAE2D0","onSurfaceVariant":"#4B4739","outline":"#7C7767","outlineVariant":"#CDC6B4","shadow":"#000000","scrim":"#000000","inverseSurface":"#333027","inverseOnSurface":"#F7F0E2","inversePrimary":"#DBC66E","primaryFixed":"#F8E287","onPrimaryFixed":"#221B00","primaryFixedDim":"#DBC66E","onPrimaryFixedVariant":"#534600","secondaryFixed":"#EEE2BC","onSecondaryFixed":"#211B04","secondaryFixedDim":"#D1C6A1","onSecondaryFixedVariant":"#4E472A","tertiaryFixed":"#C5ECCE","onTertiaryFixed":"#00210F","tertiaryFixedDim":"#A9D0B3","onTertiaryFixedVariant":"#2C4E38","surfaceDim":"#E0D9CC","surfaceBright":"#FFF9EE","surfaceContainerLowest":"#FFFFFF","surfaceContainerLow":"#FAF3E5","surfaceContainer":"#F4EDDF","surfaceContainerHigh":"#EEE8DA","surfaceContainerHighest":"#E8E2D4"},"dark":{"primary":"#DBC66E","surfaceTint":"#DBC66E","onPrimary":"#3A3000","primaryContainer":"#534600","onPrimaryContainer":"#F8E287","secondary":"#D1C6A1","onSecondary":"#363016","secondaryContainer":"#4E472A","onSecondaryContainer":"#EEE2BC","tertiary":"#A9D0B3","onTertiary":"#143723","tertiaryContainer":"#2C4E38","onTertiaryContainer":"#C5ECCE","error":"#FFB4AB","onError":"#690005","errorContainer":"#93000A","onErrorContainer":"#FFDAD6","background":"#15130B","onBackground":"#E8E2D4","surface":"#15130B","onSurface":"#E8E2D4","surfaceVariant":"#4B4739","onSurfaceVariant":"#CDC6B4","outline":"#969080","outlineVariant":"#4B4739","shadow":"#000000","scrim":"#000000","inverseSurface":"#E8E2D4","inverseOnSurface":"#333027","inversePrimary":"#6D5E0F","primaryFixed":"#F8E287","onPrimaryFixed":"#221B00","primaryFixedDim":"#DBC66E","onPrimaryFixedVariant":"#534600","secondaryFixed":"#EEE2BC","onSecondaryFixed":"#211B04","secondaryFixedDim":"#D1C6A1","onSecondaryFixedVariant":"#4E472A","tertiaryFixed":"#C5ECCE","onTertiaryFixed":"#00210F","tertiaryFixedDim":"#A9D0B3","onTertiaryFixedVariant":"#2C4E38","surfaceDim":"#15130B","surfaceBright":"#3C3930","surfaceContainerLowest":"#100E07","surfaceContainerLow":"#1E1B13","surfaceContainer":"#222017","surfaceContainerHigh":"#2D2A21","surfaceContainerHighest":"#38352B"}}},{"id":"material-theme-3","name":"Rose Quartz","seed":"#E8CFD8","schemes":{"light":{"primary":"#884A6A","surfaceTint":"#884A6A","onPrimary":"#FFFFFF","primaryContainer":"#FFD8E8","onPrimaryContainer":"#6D3352","secondary":"#725763","onSecondary":"#FFFFFF","secondaryContainer":"#FDD9E7","onSecondaryContainer":"#59404B","tertiary":"#7F553A","onTertiary":"#FFFFFF","tertiaryContainer":"#FFDBC8","onTertiaryContainer":"#643E25","error":"#BA1A1A","onError":"#FFFFFF","errorContainer":"#FFDAD6","onErrorContainer":"#93000A","background":"#FFF8F8","onBackground":"#21191D","surface":"#FFF8F8","onSurface":"#21191D","surfaceVariant":"#F1DEE4","onSurfaceVariant":"#504348","outline":"#827379","outlineVariant":"#D4C2C8","shadow":"#000000","scrim":"#000000","inverseSurface":"#372E31","inverseOnSurface":"#FCEDF1","inversePrimary":"#FDB0D4","primaryFixed":"#FFD8E8","onPrimaryFixed":"#380725","primaryFixedDim":"#FDB0D4","onPrimaryFixedVariant":"#6D3352","secondaryFixed":"#FDD9E7","onSecondaryFixed":"#2A151F","secondaryFixedDim":"#E0BDCB","onSecondaryFixedVariant":"#59404B","tertiaryFixed":"#FFDBC8","onTertiaryFixed":"#301401","tertiaryFixedDim":"#F2BB9A","onTertiaryFixedVariant":"#643E25","surfaceDim":"#E5D6DB","surfaceBright":"#FFF8F8","surfaceContainerLowest":"#FFFFFF","surfaceContainerLow":"#FFF0F4","surfaceContainer":"#F9EAEE","surfaceContainerHigh":"#F4E4E9","surfaceContainerHighest":"#EEDFE3"},"dark":{"primary":"#FDB0D4","surfaceTint":"#FDB0D4","onPrimary":"#521D3B","primaryContainer":"#6D3352","onPrimaryContainer":"#FFD8E8","secondary":"#E0BDCB","onSecondary":"#402A34","secondaryContainer":"#59404B","onSecondaryContainer":"#FDD9E7","tertiary":"#F2BB9A","onTertiary":"#4A2811","tertiaryContainer":"#643E25","onTertiaryContainer":"#FFDBC8","error":"#FFB4AB","onError":"#690005","errorContainer":"#93000A","onErrorContainer":"#FFDAD6","background":"#191114","onBackground":"#EEDFE3","surface":"#191114","onSurface":"#EEDFE3","surfaceVariant":"#504348","onSurfaceVariant":"#D4C2C8","outline":"#9D8D92","outlineVariant":"#504348","shadow":"#000000","scrim":"#000000","inverseSurface":"#EEDFE3","inverseOnSurface":"#372E31","inversePrimary":"#884A6A","primaryFixed":"#FFD8E8","onPrimaryFixed":"#380725","primaryFixedDim":"#FDB0D4","onPrimaryFixedVariant":"#6D3352","secondaryFixed":"#FDD9E7","onSecondaryFixed":"#2A151F","secondaryFixedDim":"#E0BDCB","onSecondaryFixedVariant":"#59404B","tertiaryFixed":"#FFDBC8","onTertiaryFixed":"#301401","tertiaryFixedDim":"#F2BB9A","onTertiaryFixedVariant":"#643E25","surfaceDim":"#191114","surfaceBright":"#40373A","surfaceContainerLowest":"#130C0F","surfaceContainerLow":"#21191D","surfaceContainer":"#251D21","surfaceContainerHigh":"#30282B","surfaceContainerHighest":"#3B3236"}}},{"id":"material-theme-4","name":"Warm Caramel","seed":"#986736","schemes":{"light":{"primary":"#865219","surfaceTint":"#865219","onPrimary":"#FFFFFF","primaryContainer":"#FFDCBF","onPrimaryContainer":"#6A3B01","secondary":"#735942","onSecondary":"#FFFFFF","secondaryContainer":"#FFDCBF","onSecondaryContainer":"#59422D","tertiary":"#596339","onTertiary":"#FFFFFF","tertiaryContainer":"#DDE8B3","onTertiaryContainer":"#424B24","error":"#BA1A1A","onError":"#FFFFFF","errorContainer":"#FFDAD6","onErrorContainer":"#93000A","background":"#FFF8F5","onBackground":"#211A14","surface":"#FFF8F5","onSurface":"#211A14","surfaceVariant":"#F2DFD1","onSurfaceVariant":"#51443A","outline":"#837469","outlineVariant":"#D5C3B6","shadow":"#000000","scrim":"#000000","inverseSurface":"#372F28","inverseOnSurface":"#FDEEE3","inversePrimary":"#FEB876","primaryFixed":"#FFDCBF","onPrimaryFixed":"#2D1600","primaryFixedDim":"#FEB876","onPrimaryFixedVariant":"#6A3B01","secondaryFixed":"#FFDCBF","onSecondaryFixed":"#291806","secondaryFixedDim":"#E2C0A4","onSecondaryFixedVariant":"#59422D","tertiaryFixed":"#DDE8B3","onTertiaryFixed":"#171E00","tertiaryFixedDim":"#C1CC99","onTertiaryFixedVariant":"#424B24","surfaceDim":"#E6D7CD","surfaceBright":"#FFF8F5","surfaceContainerLowest":"#FFFFFF","surfaceContainerLow":"#FFF1E8","surfaceContainer":"#FAEBE0","surfaceContainerHigh":"#F5E5DB","surfaceContainerHighest":"#EFE0D5"},"dark":{"primary":"#FEB876","surfaceTint":"#FEB876","onPrimary":"#4B2800","primaryContainer":"#6A3B01","onPrimaryContainer":"#FFDCBF","secondary":"#E2C0A4","onSecondary":"#412C18","secondaryContainer":"#59422D","onSecondaryContainer":"#FFDCBF","tertiary":"#C1CC99","onTertiary":"#2B340F","tertiaryContainer":"#424B24","onTertiaryContainer":"#DDE8B3","error":"#FFB4AB","onError":"#690005","errorContainer":"#93000A","onErrorContainer":"#FFDAD6","background":"#19120C","onBackground":"#EFE0D5","surface":"#19120C","onSurface":"#EFE0D5","surfaceVariant":"#51443A","onSurfaceVariant":"#D5C3B6","outline":"#9E8E81","outlineVariant":"#51443A","shadow":"#000000","scrim":"#000000","inverseSurface":"#EFE0D5","inverseOnSurface":"#372F28","inversePrimary":"#865219","primaryFixed":"#FFDCBF","onPrimaryFixed":"#2D1600","primaryFixedDim":"#FEB876","onPrimaryFixedVariant":"#6A3B01","secondaryFixed":"#FFDCBF","onSecondaryFixed":"#291806","secondaryFixedDim":"#E2C0A4","onSecondaryFixedVariant":"#59422D","tertiaryFixed":"#DDE8B3","onTertiaryFixed":"#171E00","tertiaryFixedDim":"#C1CC99","onTertiaryFixedVariant":"#424B24","surfaceDim":"#19120C","surfaceBright":"#403830","surfaceContainerLowest":"#130D07","surfaceContainerLow":"#211A14","surfaceContainer":"#261E18","surfaceContainerHigh":"#312822","surfaceContainerHighest":"#3C332C"}}},{"id":"material-theme-5","name":"Hot Pink","seed":"#F73C72","schemes":{"light":{"primary":"#8E4957","surfaceTint":"#8E4957","onPrimary":"#FFFFFF","primaryContainer":"#FFD9DE","onPrimaryContainer":"#713340","secondary":"#75565B","onSecondary":"#FFFFFF","secondaryContainer":"#FFD9DE","onSecondaryContainer":"#5C3F43","tertiary":"#795831","onTertiary":"#FFFFFF","tertiaryContainer":"#FFDDBA","onTertiaryContainer":"#5F411C","error":"#BA1A1A","onError":"#FFFFFF","errorContainer":"#FFDAD6","onErrorContainer":"#93000A","background":"#FFF8F7","onBackground":"#22191A","surface":"#FFF8F7","onSurface":"#22191A","surfaceVariant":"#F3DDDF","onSurfaceVariant":"#524345","outline":"#847375","outlineVariant":"#D6C2C3","shadow":"#000000","scrim":"#000000","inverseSurface":"#382E2F","inverseOnSurface":"#FEEDEE","inversePrimary":"#FFB2BE","primaryFixed":"#FFD9DE","onPrimaryFixed":"#3B0716","primaryFixedDim":"#FFB2BE","onPrimaryFixedVariant":"#713340","secondaryFixed":"#FFD9DE","onSecondaryFixed":"#2C1519","secondaryFixedDim":"#E5BDC2","onSecondaryFixedVariant":"#5C3F43","tertiaryFixed":"#FFDDBA","onTertiaryFixed":"#2B1700","tertiaryFixedDim":"#EBBF90","onTertiaryFixedVariant":"#5F411C","surfaceDim":"#E7D6D7","surfaceBright":"#FFF8F7","surfaceContainerLowest":"#FFFFFF","surfaceContainerLow":"#FFF0F1","surfaceContainer":"#FBEAEB","surfaceContainerHigh":"#F5E4E5","surfaceContainerHighest":"#F0DEE0"},"dark":{"primary":"#FFB2BE","surfaceTint":"#FFB2BE","onPrimary":"#561D2A","primaryContainer":"#713340","onPrimaryContainer":"#FFD9DE","secondary":"#E5BDC2","onSecondary":"#43292D","secondaryContainer":"#5C3F43","onSecondaryContainer":"#FFD9DE","tertiary":"#EBBF90","onTertiary":"#452B08","tertiaryContainer":"#5F411C","onTertiaryContainer":"#FFDDBA","error":"#FFB4AB","onError":"#690005","errorContainer":"#93000A","onErrorContainer":"#FFDAD6","background":"#191112","onBackground":"#F0DEE0","surface":"#191112","onSurface":"#F0DEE0","surfaceVariant":"#524345","onSurfaceVariant":"#D6C2C3","outline":"#9F8C8E","outlineVariant":"#524345","shadow":"#000000","scrim":"#000000","inverseSurface":"#F0DEE0","inverseOnSurface":"#382E2F","inversePrimary":"#8E4957","primaryFixed":"#FFD9DE","onPrimaryFixed":"#3B0716","primaryFixedDim":"#FFB2BE","onPrimaryFixedVariant":"#713340","secondaryFixed":"#FFD9DE","onSecondaryFixed":"#2C1519","secondaryFixedDim":"#E5BDC2","onSecondaryFixedVariant":"#5C3F43","tertiaryFixed":"#FFDDBA","onTertiaryFixed":"#2B1700","tertiaryFixedDim":"#EBBF90","onTertiaryFixedVariant":"#5F411C","surfaceDim":"#191112","surfaceBright":"#413738","surfaceContainerLowest":"#140C0D","surfaceContainerLow":"#22191A","surfaceContainer":"#261D1E","surfaceContainerHigh":"#312829","surfaceContainerHighest":"#3C3233"}}}]$$)
ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

