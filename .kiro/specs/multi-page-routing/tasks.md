# Tasks: Multi-Page Routing System

## Phase 1: Setup and Dependencies

### 1.1 Install Dependencies
- [x] 1.1.1 Install react-router-dom v6.x: `npm install react-router-dom`
- [x] 1.1.2 Install TypeScript types for react-router-dom: `npm install --save-dev @types/react-router-dom`
- [x] 1.1.3 Verify installation by checking package.json

### 1.2 Configure Build System
- [x] 1.2.1 Update vite.config.ts to configure code splitting for vendor chunks
- [x] 1.2.2 Configure manual chunks for react-vendor (react, react-dom, react-router-dom)
- [x] 1.2.3 Configure manual chunks for ui-vendor (framer-motion, lucide-react)
- [ ] 1.2.4 Test build configuration: `npm run build`

### 1.3 Configure Deployment
- [x] 1.3.1 Create or update vercel.json with SPA rewrite rules (if using Vercel)
- [ ] 1.3.2 Create or update netlify.toml with SPA redirect rules (if using Netlify)
- [ ] 1.3.3 Test deployment configuration in preview environment

## Phase 2: Core Routing Infrastructure

### 2.1 Initialize Router
- [x] 2.1.1 Import BrowserRouter from react-router-dom in main.tsx
- [x] 2.1.2 Wrap App component with BrowserRouter
- [ ] 2.1.3 Preserve existing OAuth callback route logic
- [ ] 2.1.4 Test that application still loads correctly

### 2.2 Define Routes in App.tsx
- [x] 2.2.1 Import Routes and Route from react-router-dom
- [x] 2.2.2 Replace existing content rendering with Routes component
- [ ] 2.2.3 Define route for home page: `<Route path="/" element={<HomePage />} />`
- [ ] 2.2.4 Define route for about page: `<Route path="/about" element={<AboutPage />} />`
- [ ] 2.2.5 Define route for projects page: `<Route path="/projects" element={<ProjectsPage />} />`
- [ ] 2.2.6 Define route for experience page: `<Route path="/experience" element={<ExperiencePage />} />`
- [ ] 2.2.7 Define route for education page: `<Route path="/education" element={<EducationPage />} />`
- [ ] 2.2.8 Define route for contact page: `<Route path="/contact" element={<ContactPage />} />`
- [ ] 2.2.9 Define catch-all route for 404: `<Route path="*" element={<NotFound />} />`
- [ ] 2.2.10 Remove KNOWN_ROUTES array and manual route checking logic

### 2.3 Update App.tsx Structure
- [x] 2.3.1 Move FloatingNavbar outside of Routes (render on all pages)
- [ ] 2.3.2 Move global modals outside of Routes (ChatPopup, CommandPalette, etc.)
- [ ] 2.3.3 Keep WelcomePreloader outside of Routes
- [ ] 2.3.4 Remove max-w-7xl container div (move to PageLayout)
- [ ] 2.3.5 Test that global components render correctly

## Phase 3: Page Layout Component

### 3.1 Create PageLayout Component
- [x] 3.1.1 Create new file: src/components/layout/PageLayout.tsx
- [ ] 3.1.2 Define PageLayoutProps interface with children, showSidebar, ready props
- [ ] 3.1.3 Implement PageLayout component with motion.div wrapper
- [ ] 3.1.4 Add page transition animations (initial, animate, exit)
- [ ] 3.1.5 Add max-w-7xl container with responsive padding
- [ ] 3.1.6 Add flex layout for sidebar and main content
- [ ] 3.1.7 Conditionally render Sidebar based on showSidebar prop
- [ ] 3.1.8 Wrap children in main element with flex-1 min-w-0 classes
- [ ] 3.1.9 Add TypeScript types and JSDoc comments
- [ ] 3.1.10 Export PageLayout component

### 3.2 Configure Page Transitions
- [ ] 3.2.1 Use useLocation() hook to get current pathname
- [ ] 3.2.2 Set location.pathname as key for AnimatePresence
- [ ] 3.2.3 Configure exit animation: opacity 0, y -20, duration 300ms
- [ ] 3.2.4 Configure enter animation: opacity 1, y 0, duration 300ms
- [ ] 3.2.5 Use AnimatePresence with mode="wait" in App.tsx
- [ ] 3.2.6 Test page transition animations

## Phase 4: Page Components

### 4.1 Create HomePage Component
- [x] 4.1.1 Create new file: src/pages/HomePage.tsx
- [ ] 4.1.2 Define PageProps interface with ready prop
- [ ] 4.1.3 Import IntroSection and PublicAnalytics
- [ ] 4.1.4 Wrap content in PageLayout with showSidebar={true}
- [ ] 4.1.5 Add Suspense wrapper for PublicAnalytics lazy loading
- [ ] 4.1.6 Add TypeScript types and JSDoc comments
- [ ] 4.1.7 Export HomePage component

### 4.2 Create AboutPage Component
- [x] 4.2.1 Create new file: src/pages/AboutPage.tsx
- [ ] 4.2.2 Import AboutSection, SkillsSection, LanguagesSection
- [ ] 4.2.3 Wrap content in PageLayout with showSidebar={true}
- [ ] 4.2.4 Add TypeScript types and JSDoc comments
- [ ] 4.2.5 Export AboutPage component

### 4.3 Create ProjectsPage Component
- [x] 4.3.1 Create new file: src/pages/ProjectsPage.tsx
- [ ] 4.3.2 Import ProjectsSection
- [ ] 4.3.3 Wrap content in PageLayout with showSidebar={true}
- [ ] 4.3.4 Add TypeScript types and JSDoc comments
- [ ] 4.3.5 Export ProjectsPage component

### 4.4 Create ExperiencePage Component
- [x] 4.4.1 Create new file: src/pages/ExperiencePage.tsx
- [ ] 4.4.2 Import ExperienceSection and TestimonialsSection
- [ ] 4.4.3 Wrap content in PageLayout with showSidebar={true}
- [ ] 4.4.4 Add TypeScript types and JSDoc comments
- [ ] 4.4.5 Export ExperiencePage component

### 4.5 Create EducationPage Component
- [x] 4.5.1 Create new file: src/pages/EducationPage.tsx
- [ ] 4.5.2 Import EducationSection
- [ ] 4.5.3 Wrap content in PageLayout with showSidebar={true}
- [ ] 4.5.4 Add TypeScript types and JSDoc comments
- [ ] 4.5.5 Export EducationPage component

### 4.6 Create ContactPage Component
- [x] 4.6.1 Create new file: src/pages/ContactPage.tsx
- [ ] 4.6.2 Import ContactFullSection and Footer
- [ ] 4.6.3 Wrap content in PageLayout with showSidebar={false}
- [ ] 4.6.4 Add TypeScript types and JSDoc comments
- [ ] 4.6.5 Export ContactPage component

### 4.7 Clean Up MainContent Component
- [x] 4.7.1 Remove or archive src/components/layout/MainContent.tsx
- [ ] 4.7.2 Remove MainContent import from App.tsx
- [ ] 4.7.3 Verify no other files import MainContent

## Phase 5: Navigation Updates

### 5.1 Update FloatingNavbar Component
- [x] 5.1.1 Import Link and useLocation from react-router-dom
- [ ] 5.1.2 Update navItems array to include path property for each item
- [ ] 5.1.3 Add icon imports: User for About, Mail for Contact
- [ ] 5.1.4 Replace scroll-based navigation with Link components
- [ ] 5.1.5 Use useLocation() to determine active nav item
- [ ] 5.1.6 Remove IntersectionObserver scroll-spy logic
- [ ] 5.1.7 Remove handleNavClick function with scrollIntoView
- [ ] 5.1.8 Update active state logic to use location.pathname
- [ ] 5.1.9 Preserve all existing buttons (theme, chat, command palette, profile, admin)
- [ ] 5.1.10 Test navigation between all pages

### 5.2 Update Keyboard Shortcuts
- [x] 5.2.1 Update projects shortcut to use navigate() instead of scrollIntoView
- [ ] 5.2.2 Import useNavigate from react-router-dom in App.tsx
- [ ] 5.2.3 Replace scroll-based shortcuts with navigation-based shortcuts
- [ ] 5.2.4 Test keyboard shortcuts for navigation

### 5.3 Update CommandPalette Navigation
- [x] 5.3.1 Open src/components/command/CommandPalette.tsx
- [ ] 5.3.2 Import useNavigate from react-router-dom
- [ ] 5.3.3 Replace scroll-based navigation with navigate() calls
- [ ] 5.3.4 Update command items to use route paths
- [ ] 5.3.5 Test command palette navigation

## Phase 6: Analytics and Tracking

### 6.1 Update Page View Tracking
- [x] 6.1.1 Add useEffect in App.tsx to track route changes
- [ ] 6.1.2 Use useLocation() to detect route changes
- [ ] 6.1.3 Call trackEvent('page_view') on route change
- [ ] 6.1.4 Include pathname in tracking data
- [ ] 6.1.5 Test analytics tracking for all routes

### 6.2 Update SEO Meta Tags
- [x] 6.2.1 Create usePageMeta custom hook for dynamic meta tags
- [ ] 6.2.2 Define page titles for each route
- [ ] 6.2.3 Define meta descriptions for each route
- [ ] 6.2.4 Update document.title on route change
- [ ] 6.2.5 Update meta description on route change
- [ ] 6.2.6 Test meta tags update correctly

### 6.3 Update Sitemap
- [x] 6.3.1 Open public/sitemap.xml
- [ ] 6.3.2 Add entries for all new routes
- [ ] 6.3.3 Set appropriate priority and changefreq for each route
- [ ] 6.3.4 Validate sitemap XML syntax

## Phase 7: Performance Optimization

### 7.1 Implement Code Splitting
- [x] 7.1.1 Wrap page components with React.lazy()
- [ ] 7.1.2 Add Suspense wrapper around Routes in App.tsx
- [ ] 7.1.3 Create PageLoader component for loading state
- [ ] 7.1.4 Test lazy loading works correctly
- [ ] 7.1.5 Verify bundle sizes are within limits

### 7.2 Optimize Animations
- [ ] 7.2.1 Use CSS transforms for page transitions
- [ ] 7.2.2 Add will-change CSS property to animated elements
- [ ] 7.2.3 Test animation performance with Chrome DevTools
- [ ] 7.2.4 Ensure 60fps during transitions

### 7.3 Implement Preloading
- [ ] 7.3.1 Add prefetch logic for likely next routes
- [ ] 7.3.2 Preload route chunks on navigation item hover
- [ ] 7.3.3 Test preloading improves perceived performance

## Phase 8: Testing

### 8.1 Unit Tests
- [ ] 8.1.1 Write tests for PageLayout component
- [ ] 8.1.2 Write tests for each page component
- [ ] 8.1.3 Write tests for FloatingNavbar navigation logic
- [ ] 8.1.4 Write tests for route configuration
- [ ] 8.1.5 Write tests for active nav item logic
- [ ] 8.1.6 Achieve 80%+ code coverage

### 8.2 Integration Tests
- [ ] 8.2.1 Write test for full navigation flow (home → projects → contact)
- [ ] 8.2.2 Write test for browser back/forward navigation
- [ ] 8.2.3 Write test for direct URL access (deep linking)
- [ ] 8.2.4 Write test for navigation with authentication state
- [ ] 8.2.5 Write test for navigation with theme changes
- [ ] 8.2.6 Write test for mobile responsive navigation

### 8.3 Property-Based Tests
- [ ] 8.3.1 Install fast-check: `npm install --save-dev fast-check`
- [ ] 8.3.2 Write property test for route uniqueness
- [ ] 8.3.3 Write property test for navigation idempotence
- [ ] 8.3.4 Write property test for active state consistency
- [ ] 8.3.5 Write property test for sidebar determinism

### 8.4 Manual Testing
- [ ] 8.4.1 Test navigation on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] 8.4.2 Test navigation on mobile devices (iOS, Android)
- [ ] 8.4.3 Test keyboard navigation (Tab, Enter, arrow keys)
- [ ] 8.4.4 Test screen reader navigation
- [ ] 8.4.5 Test page transitions are smooth
- [ ] 8.4.6 Test deep linking works correctly
- [ ] 8.4.7 Test browser back/forward buttons
- [ ] 8.4.8 Test all existing features still work (chat, command palette, etc.)

## Phase 9: Documentation

### 9.1 Code Documentation
- [ ] 9.1.1 Add JSDoc comments to PageLayout component
- [ ] 9.1.2 Add JSDoc comments to all page components
- [ ] 9.1.3 Add inline comments to routing configuration
- [ ] 9.1.4 Add comments to page transition animation logic

### 9.2 User Documentation
- [ ] 9.2.1 Update README.md with routing architecture overview
- [ ] 9.2.2 Document how to add new routes
- [ ] 9.2.3 Document deployment configuration for SPA routing
- [ ] 9.2.4 Document keyboard shortcuts for navigation

### 9.3 Implementation Summary
- [ ] 9.3.1 Create IMPLEMENTATION_SUMMARY.md for this feature
- [ ] 9.3.2 Document architectural changes
- [ ] 9.3.3 Document migration steps
- [ ] 9.3.4 Document rollback procedure
- [ ] 9.3.5 Document known issues and limitations

## Phase 10: Deployment and Validation

### 10.1 Pre-Deployment Checks
- [ ] 10.1.1 Run all tests: `npm run test`
- [ ] 10.1.2 Run build: `npm run build`
- [ ] 10.1.3 Check bundle sizes
- [ ] 10.1.4 Run Lighthouse audit
- [ ] 10.1.5 Verify no TypeScript errors
- [ ] 10.1.6 Verify no console errors

### 10.2 Deploy to Staging
- [ ] 10.2.1 Deploy to staging environment
- [ ] 10.2.2 Test all routes in staging
- [ ] 10.2.3 Test deep linking in staging
- [ ] 10.2.4 Test browser back/forward in staging
- [ ] 10.2.5 Verify analytics tracking works

### 10.3 Deploy to Production
- [ ] 10.3.1 Deploy to production environment
- [ ] 10.3.2 Monitor error logs for issues
- [ ] 10.3.3 Verify all routes work in production
- [ ] 10.3.4 Monitor performance metrics
- [ ] 10.3.5 Monitor analytics data

### 10.4 Post-Deployment Validation
- [ ] 10.4.1 Verify Lighthouse scores remain above 90
- [ ] 10.4.2 Verify page load times are acceptable
- [ ] 10.4.3 Verify no increase in error rates
- [ ] 10.4.4 Verify user engagement metrics
- [ ] 10.4.5 Collect user feedback

## Phase 11: Optional Enhancements

### 11.1 Scroll Position Restoration
- [ ] 11.1.1 Implement scroll position saving per route
- [ ] 11.1.2 Restore scroll position when navigating back
- [ ] 11.1.3 Test scroll restoration works correctly

### 11.2 Route Prefetching
- [ ] 11.2.1 Implement intelligent route prefetching
- [ ] 11.2.2 Prefetch routes based on user behavior
- [ ] 11.2.3 Test prefetching improves performance

### 11.3 Loading States
- [ ] 11.3.1 Create skeleton loaders for each page type
- [ ] 11.3.2 Show loading state during route transitions
- [ ] 11.3.3 Test loading states display correctly

### 11.4 Error Boundaries
- [ ] 11.4.1 Create route-specific error boundaries
- [ ] 11.4.2 Handle page component errors gracefully
- [ ] 11.4.3 Provide recovery options in error UI
- [ ] 11.4.4 Test error boundaries catch errors

### 11.5 Breadcrumbs
- [ ] 11.5.1 Update ContextualBreadcrumbs to work with routes
- [ ] 11.5.2 Display breadcrumbs on all pages
- [ ] 11.5.3 Make breadcrumbs clickable for navigation
- [ ] 11.5.4 Test breadcrumbs update correctly

## Summary

**Total Tasks**: 150+
**Estimated Effort**: 3-5 days
**Priority**: High
**Dependencies**: react-router-dom v6.x

**Critical Path**:
1. Phase 1: Setup and Dependencies
2. Phase 2: Core Routing Infrastructure
3. Phase 3: Page Layout Component
4. Phase 4: Page Components
5. Phase 5: Navigation Updates
6. Phase 8: Testing
7. Phase 10: Deployment

**Risk Areas**:
- Page transition animations may need fine-tuning
- Analytics tracking needs careful testing
- Deployment configuration varies by platform
- Performance optimization may require iteration
