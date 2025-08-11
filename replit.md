# Freelancer Connect - Local Service Hiring App

## Overview

Freelancer Connect is a comprehensive full-stack web application designed to connect local customers with independent service providers (freelancers) such as electricians, plumbers, carpenters, and other skilled professionals. The platform serves three distinct user roles: customers who need services, freelancers who provide services, and administrators who manage the platform.

The application features a modern mobile-first design with real-time notifications, subscription management, lead distribution, and a comprehensive admin dashboard. It's built as a Progressive Web App (PWA) optimized for mobile devices while maintaining full desktop compatibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management with caching and synchronization
- **UI Components**: Radix UI primitives with shadcn/ui component system for accessibility and consistency
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Real-time Communication**: WebSocket integration for live notifications and updates
- **Session Management**: Express sessions with PostgreSQL store for persistent user sessions
- **Authentication**: Replit Authentication with OIDC integration
- **File Structure**: Monorepo structure with shared schema between client and server

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless configuration
- **Schema Management**: Centralized schema definitions using Drizzle ORM with TypeScript
- **Key Entities**:
  - Users with role-based access (customer, freelancer, admin)
  - Categories for service types
  - Freelancer profiles with verification status and badges
  - Leads with status tracking and interest management
  - Subscriptions for premium features (lead access, position ranking, badges)
  - Lead interests for non-subscribers to express interest
- **Relationships**: Well-defined foreign key relationships with proper indexing for performance

### Authentication & Authorization
- **Primary Auth**: Firebase Authentication with Google OAuth and Phone number authentication
- **Google Sign-in**: Full account selection interface with proper Gmail integration
- **Phone Authentication**: SMS-based OTP verification with reCAPTCHA protection
- **Session Strategy**: Firebase Auth state management with real-time user monitoring
- **Role Management**: Dynamic role assignment after initial authentication
- **Security Features**: Firebase security rules, reCAPTCHA verification, and secure token handling

### Enhanced Freelancer Profile System
- **Circular Progress Indicator**: Dynamic completion score calculation (required 70%, optional 30%)
- **Comprehensive Profile Fields**: Professional title, bio, experience, skills, portfolio, certifications, pricing, availability
- **File Upload Integration**: Object storage for profile photos, portfolio images, and ID verification documents
- **Real-time Validation**: Form validation with green checkmarks for completed sections
- **Progress-based UI**: Color-coded completion badges and progress tracking
- **Route Structure**: Dedicated `/freelancer/profile` route for enhanced profile management

### Real-time Features
- **WebSocket Server**: Custom WebSocket implementation for real-time notifications
- **Client Management**: Connection mapping for user-specific message delivery
- **Notification Types**: New lead alerts, subscription updates, and system announcements
- **Reconnection Logic**: Automatic reconnection with exponential backoff for reliability

### Admin Dashboard Analytics
- **Payment Analytics**: Comprehensive freelancer payment status tracking
- **Visual Indicators**: Color-coded cards showing paid vs non-paid freelancers with percentages
- **Financial Metrics**: Total earnings, average earnings per freelancer calculations
- **Progress Visualization**: Interactive progress bar showing payment distribution
- **Quick Actions**: Direct access to payment reports and user management tools

### Subscription System
- **Lead Plan**: Access to browse and accept available leads
- **Position Plan**: Priority positioning in freelancer search results
- **Badge Plan**: Verified or trusted badges for enhanced credibility
- **Payment Integration**: Razorpay SDK ready for payment processing (configured but not implemented)

### Mobile-First Design
- **Responsive Layout**: Tailwind CSS breakpoints optimized for mobile devices
- **Navigation**: Bottom navigation bar following mobile app conventions
- **Touch Interactions**: Optimized button sizes and touch targets
- **Performance**: Lazy loading and code splitting for optimal mobile performance

## External Dependencies

### Development & Build Tools
- **Vite**: Fast build tool with React plugin and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing

### Database & ORM
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **Drizzle Kit**: Database introspection and migration management

### UI & Styling
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component system based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom theming
- **Lucide React**: Icon library for consistent iconography
- **Font Awesome**: Additional icon system for service categories

### State Management & Data Fetching
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for forms and API data

### Real-time & Communication
- **WebSocket (ws)**: WebSocket server implementation for real-time features
- **Socket connection management**: Custom client-side WebSocket handling

### Authentication & Security
- **Replit Authentication**: OIDC-based authentication system
- **OpenID Connect**: Standard authentication protocol implementation
- **Express Session**: Session management with PostgreSQL store
- **Passport.js**: Authentication middleware for Express

### Utilities & Helpers
- **date-fns**: Date manipulation and formatting
- **class-variance-authority**: Utility for conditional CSS classes
- **clsx & tailwind-merge**: CSS class manipulation and merging
- **nanoid**: Unique ID generation for various entities
- **memoizee**: Function memoization for performance optimization

The application is designed to scale horizontally with its serverless database architecture and can be easily deployed on platforms like Replit, Vercel, or similar cloud providers.