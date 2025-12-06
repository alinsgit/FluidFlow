export interface PromptItem {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompts: PromptItem[];
}

export const promptLibrary: PromptCategory[] = [
  {
    id: 'design',
    name: 'Design & Style',
    icon: 'Palette',
    description: 'Visual improvements and styling',
    prompts: [
      { id: 'd1', label: 'Modernize Design', prompt: 'Make the design more modern with clean lines, subtle shadows, and contemporary typography. Use a minimalist approach with generous whitespace.' },
      { id: 'd2', label: 'Glassmorphism Style', prompt: 'Apply glassmorphism style with frosted glass effects, subtle transparency, and soft blurs. Use light borders and elegant shadows.' },
      { id: 'd3', label: 'Neumorphism Style', prompt: 'Convert to neumorphism design with soft shadows, embossed elements, and a cohesive monochromatic color scheme.' },
      { id: 'd4', label: 'Dark Mode', prompt: 'Create an elegant dark mode version with proper contrast ratios, muted accents, and comfortable reading experience.' },
      { id: 'd5', label: 'Light Mode', prompt: 'Design a clean light mode with subtle grays, proper contrast, and a fresh, airy feel.' },
      { id: 'd6', label: 'Gradient Accents', prompt: 'Add beautiful gradient accents to buttons, headers, and interactive elements. Use smooth color transitions.' },
      { id: 'd7', label: 'Brutalist Style', prompt: 'Apply brutalist design with bold typography, raw aesthetics, high contrast, and unconventional layouts.' },
      { id: 'd8', label: 'Corporate/Professional', prompt: 'Make it look professional and corporate with clean layouts, trustworthy colors (blues, grays), and formal typography.' },
      { id: 'd9', label: 'Playful & Colorful', prompt: 'Add playful elements with vibrant colors, rounded corners, fun illustrations placeholders, and energetic feel.' },
      { id: 'd10', label: 'Luxury/Premium', prompt: 'Create a luxury feel with rich colors (gold, deep purple, black), elegant typography, and refined details.' },
    ]
  },
  {
    id: 'responsive',
    name: 'Responsive',
    icon: 'Smartphone',
    description: 'Mobile and tablet optimization',
    prompts: [
      { id: 'r1', label: 'Mobile First', prompt: 'Optimize for mobile devices first. Stack elements vertically, increase touch targets, and simplify navigation for small screens.' },
      { id: 'r2', label: 'Tablet Layout', prompt: 'Create a beautiful tablet layout with two-column grids where appropriate, optimized spacing, and touch-friendly elements.' },
      { id: 'r3', label: 'Full Responsive', prompt: 'Make fully responsive for all screen sizes. Use fluid typography, flexible grids, and appropriate breakpoints for mobile, tablet, and desktop.' },
      { id: 'r4', label: 'Mobile Navigation', prompt: 'Add a mobile-friendly hamburger menu with slide-out navigation, smooth animations, and proper touch interactions.' },
      { id: 'r5', label: 'Responsive Images', prompt: 'Optimize image layouts to be responsive with proper aspect ratios, lazy loading placeholders, and grid adjustments for different screens.' },
      { id: 'r6', label: 'Collapsible Sections', prompt: 'Make sections collapsible on mobile with accordion-style interactions to save vertical space.' },
    ]
  },
  {
    id: 'ux',
    name: 'UX Improvements',
    icon: 'Sparkles',
    description: 'User experience enhancements',
    prompts: [
      { id: 'u1', label: 'Better CTAs', prompt: 'Improve call-to-action buttons with better visibility, compelling microcopy, and clear visual hierarchy.' },
      { id: 'u2', label: 'Loading States', prompt: 'Add proper loading states with skeleton screens, spinners, and progress indicators for async operations.' },
      { id: 'u3', label: 'Empty States', prompt: 'Design helpful empty states with illustrations, clear messaging, and action buttons to guide users.' },
      { id: 'u4', label: 'Error Handling', prompt: 'Add user-friendly error states with clear error messages, recovery suggestions, and retry options.' },
      { id: 'u5', label: 'Form Validation', prompt: 'Improve forms with inline validation, helpful error messages, success states, and better input feedback.' },
      { id: 'u6', label: 'Onboarding Flow', prompt: 'Add an onboarding flow with welcome screens, feature highlights, and guided tour elements.' },
      { id: 'u7', label: 'Tooltips & Hints', prompt: 'Add helpful tooltips and contextual hints to explain features and guide users.' },
      { id: 'u8', label: 'Breadcrumbs', prompt: 'Add breadcrumb navigation to help users understand their location and navigate back easily.' },
      { id: 'u9', label: 'Search Feature', prompt: 'Add a search functionality with search input, results display, filters, and "no results" state.' },
      { id: 'u10', label: 'Notifications', prompt: 'Add a notification system with toast messages, notification badges, and a notification center.' },
    ]
  },
  {
    id: 'animation',
    name: 'Animation',
    icon: 'Zap',
    description: 'Motion and transitions',
    prompts: [
      { id: 'a1', label: 'Micro-interactions', prompt: 'Add subtle micro-interactions to buttons, inputs, and interactive elements. Use hover effects, focus states, and click feedback.' },
      { id: 'a2', label: 'Page Transitions', prompt: 'Add smooth page/section transitions with fade, slide, or scale animations.' },
      { id: 'a3', label: 'Scroll Animations', prompt: 'Add scroll-triggered animations where elements fade in, slide up, or scale as they enter the viewport.' },
      { id: 'a4', label: 'Hover Effects', prompt: 'Add engaging hover effects to cards, buttons, and links with smooth transitions and visual feedback.' },
      { id: 'a5', label: 'Loading Animations', prompt: 'Create custom loading animations with CSS animations - spinners, progress bars, or skeleton loaders.' },
      { id: 'a6', label: 'Button Animations', prompt: 'Add satisfying button animations - ripple effects, bounce on click, and smooth state transitions.' },
      { id: 'a7', label: 'Card Animations', prompt: 'Add card hover animations with lift effects, shadows, and subtle transforms.' },
    ]
  },
  {
    id: 'components',
    name: 'Components',
    icon: 'LayoutGrid',
    description: 'Add new UI components',
    prompts: [
      { id: 'c1', label: 'Add Header', prompt: 'Add a modern header/navbar with logo, navigation links, and a mobile-responsive menu.' },
      { id: 'c2', label: 'Add Footer', prompt: 'Add a comprehensive footer with links, social icons, newsletter signup, and copyright.' },
      { id: 'c3', label: 'Add Sidebar', prompt: 'Add a collapsible sidebar navigation with icons, labels, and nested menu items.' },
      { id: 'c4', label: 'Add Modal', prompt: 'Add a reusable modal component with backdrop, close button, and smooth open/close animations.' },
      { id: 'c5', label: 'Add Tabs', prompt: 'Add a tabbed interface component with smooth tab switching and content panels.' },
      { id: 'c6', label: 'Add Carousel', prompt: 'Add an image/content carousel with navigation arrows, dots, and auto-play option.' },
      { id: 'c7', label: 'Add Cards Grid', prompt: 'Add a responsive card grid layout with consistent card components.' },
      { id: 'c8', label: 'Add Data Table', prompt: 'Add a data table with sortable columns, pagination, and search functionality.' },
      { id: 'c9', label: 'Add Hero Section', prompt: 'Add an impactful hero section with headline, subtext, CTA button, and background.' },
      { id: 'c10', label: 'Add Testimonials', prompt: 'Add a testimonials section with avatar, quote, name, and optional company.' },
      { id: 'c11', label: 'Add Pricing Table', prompt: 'Add a pricing table with plan comparison, features list, and CTA buttons.' },
      { id: 'c12', label: 'Add FAQ Section', prompt: 'Add an FAQ section with expandable/collapsible question-answer items.' },
    ]
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    icon: 'Accessibility',
    description: 'A11y improvements',
    prompts: [
      { id: 'ac1', label: 'WCAG Compliance', prompt: 'Ensure WCAG 2.1 AA compliance with proper contrast ratios, focus indicators, and semantic HTML.' },
      { id: 'ac2', label: 'Keyboard Navigation', prompt: 'Improve keyboard navigation with proper focus management, skip links, and logical tab order.' },
      { id: 'ac3', label: 'Screen Reader Support', prompt: 'Add ARIA labels, roles, and live regions for better screen reader support.' },
      { id: 'ac4', label: 'Color Contrast', prompt: 'Fix color contrast issues to meet WCAG AA standards (4.5:1 for text, 3:1 for large text).' },
      { id: 'ac5', label: 'Focus Indicators', prompt: 'Add visible and consistent focus indicators for all interactive elements.' },
    ]
  },
  {
    id: 'content',
    name: 'Content',
    icon: 'FileText',
    description: 'Content and copy improvements',
    prompts: [
      { id: 'co1', label: 'Realistic Content', prompt: 'Replace placeholder content with realistic, contextual mock data that matches the app purpose.' },
      { id: 'co2', label: 'Better Microcopy', prompt: 'Improve button labels, form hints, and UI text with clearer, more actionable microcopy.' },
      { id: 'co3', label: 'Add Icons', prompt: 'Add relevant icons from lucide-react to buttons, menu items, and content sections.' },
      { id: 'co4', label: 'Typography Hierarchy', prompt: 'Improve typography with clear visual hierarchy - headings, subheadings, body text, and captions.' },
      { id: 'co5', label: 'Image Placeholders', prompt: 'Add proper image placeholder components with aspect ratios and loading states.' },
    ]
  },
  {
    id: 'features',
    name: 'Features',
    icon: 'Wrench',
    description: 'Functionality additions',
    prompts: [
      { id: 'f1', label: 'Theme Toggle', prompt: 'Add a dark/light theme toggle with smooth transitions and persistent preference.' },
      { id: 'f2', label: 'Filter & Sort', prompt: 'Add filtering and sorting functionality to lists/grids with intuitive UI controls.' },
      { id: 'f3', label: 'Pagination', prompt: 'Add pagination component with page numbers, prev/next buttons, and items per page selector.' },
      { id: 'f4', label: 'Like/Favorite', prompt: 'Add like/favorite functionality with heart icons, counters, and toggle animations.' },
      { id: 'f5', label: 'Share Buttons', prompt: 'Add social share buttons for common platforms with proper icons and share functionality.' },
      { id: 'f6', label: 'Copy to Clipboard', prompt: 'Add copy-to-clipboard functionality with visual feedback and success state.' },
      { id: 'f7', label: 'Infinite Scroll', prompt: 'Replace pagination with infinite scroll loading with a loading indicator.' },
      { id: 'f8', label: 'Drag & Drop', prompt: 'Add drag and drop functionality for reordering items with visual feedback.' },
    ]
  },
];

// Quick access prompts for the main dropdown
export const quickPrompts: PromptItem[] = [
  { id: 'q1', label: '✨ Beautify Design', prompt: 'Make the design more beautiful and polished with better spacing, shadows, and visual hierarchy.' },
  { id: 'q2', label: '📱 Make Responsive', prompt: 'Make fully responsive for mobile, tablet, and desktop with proper breakpoints.' },
  { id: 'q3', label: '🌙 Add Dark Mode', prompt: 'Create an elegant dark mode version with proper contrast and muted accents.' },
  { id: 'q4', label: '⚡ Add Animations', prompt: 'Add smooth micro-interactions, hover effects, and transitions throughout.' },
  { id: 'q5', label: '🎯 Improve UX', prompt: 'Improve user experience with better CTAs, loading states, and intuitive interactions.' },
  { id: 'q6', label: '♿ Fix Accessibility', prompt: 'Ensure accessibility with proper contrast, focus indicators, and ARIA labels.' },
];
