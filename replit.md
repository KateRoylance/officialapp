# Blossom and Bloom Marketing

A mobile app for marketing clients to upload content, view content ideas, and monitor social media activity.

## Overview

This is an Expo React Native app with an Express.js backend. Clients can:
- Login with email/password and optional biometric authentication (Face ID/Touch ID)
- View suggested content ideas for the week
- Upload photos and videos for editing
- View content calendar organized by social media platform (Instagram, Facebook, TikTok)
- View comments and DMs from their social media accounts

## Project Structure

```
├── client/                    # React Native Expo frontend
│   ├── App.tsx               # Main app entry with providers
│   ├── components/           # Reusable UI components
│   ├── constants/theme.ts    # Theme colors, spacing, typography
│   ├── contexts/             # React contexts (AuthContext)
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities (query-client)
│   ├── navigation/           # React Navigation structure
│   │   ├── RootStackNavigator.tsx    # Auth flow handling
│   │   ├── MainTabNavigator.tsx      # Bottom tab navigation
│   │   ├── IdeasStackNavigator.tsx    # Ideas tab stack
│   │   ├── UploadStackNavigator.tsx   # Upload tab stack
│   │   ├── CalendarStackNavigator.tsx # Calendar tab stack
│   │   ├── SocialStackNavigator.tsx   # Social tab stack
│   │   └── ProfileStackNavigator.tsx  # Profile tab stack
│   └── screens/              # Screen components
│       ├── LoginScreen.tsx   # Authentication screen
│       ├── IdeasScreen.tsx    # Content suggestions
│       ├── UploadScreen.tsx   # Media upload
│       ├── CalendarScreen.tsx # Content calendar by platform
│       ├── SocialScreen.tsx   # Social activity feed
│       └── ProfileScreen.tsx  # User profile & settings
├── server/                   # Express.js backend
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   └── storage.ts            # Data storage
├── shared/                   # Shared types/schemas
│   └── schema.ts             # Database schema
├── assets/images/            # App icons and illustrations
└── design_guidelines.md      # Design specifications
```

## Design System

### Colors (Orange Theme)
- Primary Orange: #FF6B35
- Orange Light: #FF8C61
- Orange Dark: #E85A2A
- Background: #FAFAF8 (warm off-white)
- Surface: #FFFFFF
- Soft Cream: #FFF5ED

### Key Features
- Biometric authentication (Face ID/Touch ID)
- Remember me functionality with secure storage
- Orange gradient buttons and accents
- Card-based UI with subtle shadows
- Pull-to-refresh on lists
- Haptic feedback on interactions

## Running the App

### Development
- Backend: `NODE_ENV=development PORT=3001 npx tsx server/index.ts` (port 3001)
- Frontend: Expo dev server (port 8081)

### Backend Stability Notes
- Server runs on port 3001 (port 5000 had Replit workflow manager conflicts)
- A silent keepalive `setInterval` in `server/index.ts` prevents the Node.js event loop from going idle during the SendGrid network calls in the approval job
- Global error handlers (uncaughtException, unhandledRejection, SIGPIPE) prevent silent crashes

### Testing on Device
Scan the QR code in Expo Go to test on physical devices.

## User Preferences

- Orange color theme
- Simple login with biometric support
- Five main sections: Ideas, Upload, Calendar, Social, Profile

## Admin Area

The business owner (kate@blossomandbloommarketing.com) has access to an admin dashboard with:
- **Dashboard**: Stats for Total Clients, Pending Approvals, Scheduled Posts, Unread Messages
- **Clients**: View all clients, search, add new clients via enrollment
- **Uploads**: View each client and their uploaded content with status (pending/approved/scheduled)
- **Content**: View pending approvals and scheduled posts
- **Settings**: App settings and preferences

### Client Enrollment Flow
1. Admin adds client via "Enroll Client" form (business name, email, type, notes)
2. Client receives invitation email with unique link
3. Client clicks link to access "Set Password" screen
4. Client creates password meeting requirements (8+ chars, number, upper/lowercase)
5. Client can now login with their credentials

### Invitation Management
- Clients with pending invitations show "Pending" status in yellow
- "Resend Invitation" button available for pending clients
- Invitations expire after 48 hours

## Approval Workflow

1. Client uploads content via Upload tab
2. Admin schedules the upload with caption, hashtags, platform, and date/time
3. Scheduled post appears in client's Calendar screen with "Pending Approval" status
4. Client reviews and can Approve or Reject (with feedback) the scheduled post
5. Admin sees the approval status in Content section (read-only display)
6. Approved posts are ready for publishing at scheduled time

### Approval Reminders
- Background job runs hourly to check pending approvals
- **72 hours before**: If a scheduled post is still pending approval, client receives an email reminder
- **48 hours before**: If no action taken after reminder, post is automatically approved
- Clients can toggle approval reminders on/off in Profile > Notification Settings
- Auto-approved posts are marked with `autoApproved: "true"` flag

## Password Reset Flow

Clients can reset their password if forgotten:
1. Click "Forgot password?" link on login screen
2. Enter email address and submit
3. Receive password reset email with unique link (expires in 1 hour)
4. Click link to access Reset Password screen
5. Create new password meeting requirements (8+ chars, number, upper/lowercase)
6. Login with new password

### Password Reset API Endpoints
- `POST /api/clients/forgot-password` - Request password reset email
- `GET /api/clients/verify-reset-token/:token` - Verify token is valid
- `POST /api/clients/reset-password` - Set new password with token

### Client Schema Fields
- `resetToken` - Unique token for password reset
- `resetTokenExpiresAt` - Token expiration timestamp (1 hour)

## Email Notifications

The app uses SendGrid for sending transactional emails:
- **Enrollment Emails**: When admin enrolls a new client, they automatically receive an invitation email with a link to set their password
- **Resend Invitations**: Admin can resend invitation emails to pending clients from the Clients screen
- **Approval Reminders**: Automated emails sent 72 hours before scheduled posts if client hasn't approved yet
- **Password Reset**: When a client requests password reset, they receive an email with a secure link
- Email template includes Blossom and Bloom branding with the orange theme

### Email Integration
- Email service: `server/email.ts` (uses SendGrid connector via Replit integration)
- Emails sent from: Configured in SendGrid connection settings

## Recent Changes

- Fixed backend crash: moved server to port 3001, added silent keepalive interval and global error handlers to prevent event loop from going idle during SendGrid network calls
- Content ideas now support optional links and media attachments (images/videos)
- Admin Ideas screen has new fields for adding link and picking media when creating ideas
- Client Ideas screen displays attached links and media when viewing idea details
- Added rejection notification emails sent to admin when client rejects a scheduled post
- Added password reset functionality with email-based flow (ForgotPasswordScreen, ResetPasswordScreen)
- Added approval reminder system with automatic post approval
- Background job sends reminder emails 72 hours before scheduled posts
- Posts auto-approve 48 hours before if no action taken after reminder
- Notification Settings screen now includes toggleable "Approval Reminders" option
- New client field: `approvalRemindersEnabled` (defaults to "true")
- New upload fields: `reminderSentAt`, `autoApproved`
- Switched email service from Resend to SendGrid (better domain compatibility)
- Admin can resend invitation emails to pending clients
- Connected client Calendar screen to real scheduled uploads API
- Clients can now approve/reject scheduled posts from their Calendar
- Admin Content section shows read-only approval status ("Awaiting client approval" / "Client approved")
- Approval status syncs between client app and admin portal
- Connected client uploads to admin portal via API endpoints
- Admin can now see uploads submitted by clients with their notes
- Admin can set upload status to "pending approval" or "scheduled"
- Scheduled posts auto-delete 48 hours after scheduled time
- Added API routes for uploads, clients, and status management
- Added client enrollment with invitation flow
- Added Set Password screen for new clients
- Updated admin email to kate@blossomandbloommarketing.com
- Added resend invitation functionality
- Initial app creation with auth flow
- Login screen with Face ID/Touch ID support
- Ideas tab with weekly content suggestions
- Upload tab with image/video picker
- Content Calendar tab with week view and platform sections (Instagram, Facebook, TikTok)
- Social tab with comments and DMs feed
- Profile screen with settings and logout

## API Endpoints

- `GET /api/uploads` - Get all uploads grouped by client (for admin)
- `GET /api/uploads/client/:clientId` - Get uploads for a specific client
- `POST /api/uploads` - Create a new upload (from client portal)
- `PATCH /api/uploads/:id` - Update upload status (from admin)
- `DELETE /api/uploads/:id` - Delete an upload
- `GET /api/clients` - Get all clients
- `POST /api/clients/login` - Client login (handles both client and support user auth)
- `POST /api/set-password` - Unified set-password for both client and support user invitation tokens
- `GET /api/clients/:clientId/support-users` - Get support users for a client
- `POST /api/clients/:clientId/support-users` - Add a support user to a client
- `DELETE /api/support-users/:id` - Delete a support user
