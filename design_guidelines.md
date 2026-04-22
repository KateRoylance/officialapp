# Blossom and Bloom Marketing - Design Guidelines

## Brand Identity
**Purpose**: A professional content management tool where marketing clients submit photos/videos for editing and receive content suggestions.

**Aesthetic Direction**: **Professional/Creative Fusion** - Polished and trustworthy with energetic orange accents that reflect the creative marketing industry. Clean layouts with generous whitespace, but warm and approachable rather than corporate-cold.

**Memorable Element**: Bold orange gradient treatments on key interactive elements and a distinctive content card design that makes uploaded media feel precious and well-organized.

## Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs)
- **Ideas Tab**: Suggested content from admin
- **Upload Tab**: Media submission (center position - core action)
- **Social Tab**: Comments and DMs feed

**Auth Flow**: Stack-based login → Tab Navigator

## Screen-by-Screen Specifications

### 1. Login Screen
**Purpose**: Secure client authentication with biometric support

**Layout**:
- Header: None (full-screen branded experience)
- Main: Centered card with logo, inputs, and biometric option
- Top inset: insets.top + Spacing.xxl
- Bottom inset: insets.bottom + Spacing.xl

**Components**:
- App logo/wordmark at top
- Email input field
- Password input field
- "Remember Me" toggle
- Biometric login button (Face ID/Touch ID icon) - prominent secondary button
- Primary "Sign In" button below form
- Small "Forgot Password?" link

**Visual Notes**:
- Soft gradient background (cream to light orange)
- Elevated white card for form (subtle shadow)
- Biometric button should feel trustworthy and quick-access

### 2. Ideas Tab (Suggested Content)
**Purpose**: View admin-curated content suggestions for the week

**Layout**:
- Header: Transparent, title "Content Ideas", no buttons
- Main: ScrollView with card list
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Week indicator ("This Week: Jan 15-21")
- Content suggestion cards (each containing):
  - Suggestion title
  - Brief description
  - Small "inspiration" badge
  - Checkmark button to mark as completed/seen
- Empty state when no suggestions

**Visual Notes**:
- Cards have subtle left orange accent border
- Completed items show checkmark and reduced opacity

### 3. Upload Tab
**Purpose**: Submit photos/videos while preserving quality

**Layout**:
- Header: Transparent, title "Upload Content"
- Main: ScrollView
- Floating FAB: Camera/gallery picker button (bottom right)
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
- FAB bottom inset: tabBarHeight + Spacing.xl

**Components**:
- "Recent Uploads" section with thumbnail grid
- Each upload shows:
  - Media thumbnail
  - Upload date
  - Status badge (Processing/Ready)
- Large dashed-border upload zone at top
- Floating action button (camera icon) with orange gradient

**Visual Notes**:
- Upload zone has animated dashed border on press
- Thumbnails in 2-column grid with rounded corners
- FAB uses orange gradient with subtle shadow

### 4. Social Tab
**Purpose**: View aggregated comments and DMs from social platforms

**Layout**:
- Header: Transparent, title "Social Activity", filter icon (right)
- Main: FlatList
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Filter button (Comments/DMs/All)
- Activity feed items showing:
  - Platform icon (Instagram/Facebook/etc)
  - Message preview
  - Timestamp
  - Unread indicator dot
- Pull-to-refresh
- Empty state when no activity

**Visual Notes**:
- Unread items have orange dot indicator
- Platform icons in branded colors
- Subtle dividers between items

## Color Palette

**Primary**:
- Orange Primary: #FF6B35
- Orange Light: #FF8C61
- Orange Dark: #E85A2A

**Backgrounds**:
- Background: #FAFAF8 (warm off-white)
- Surface: #FFFFFF
- Card Elevated: #FFFFFF with shadow

**Text**:
- Primary Text: #1A1A1A
- Secondary Text: #666666
- Tertiary Text: #999999

**Semantic**:
- Success: #4CAF50
- Warning: #FFC107
- Neutral: #E0E0E0

**Accent**:
- Soft Cream: #FFF5ED (backgrounds, gradients)

## Typography

**Font Family**: System fonts
- iOS: SF Pro
- Android: Roboto

**Type Scale**:
- Title Large: 28pt, Bold
- Title: 22pt, Semibold
- Headline: 18pt, Semibold
- Body: 16pt, Regular
- Caption: 14pt, Regular
- Small: 12pt, Regular

## Visual Design

**Buttons**:
- Primary: Orange gradient (#FF6B35 to #FF8C61), white text, 12pt radius
- Secondary: White with orange border, orange text, 12pt radius
- Text only: Orange text, no background
- Press feedback: 90% opacity

**Cards**:
- Background: White
- Border radius: 16pt
- Shadow: shadowOffset width:0 height:2, shadowOpacity:0.08, shadowRadius:8

**Floating Action Button** (Upload tab):
- Orange gradient background
- White icon (camera/plus)
- 56pt diameter, circular
- Shadow: shadowOffset width:0 height:2, shadowOpacity:0.10, shadowRadius:2

**Icons**: Feather icons from @expo/vector-icons, 20-24pt size

## Assets to Generate

1. **icon.png** - App icon featuring stylized flower + mobile device, orange gradient
   - WHERE USED: Device home screen

2. **splash-icon.png** - Simplified logo mark on orange background
   - WHERE USED: App launch screen

3. **empty-ideas.png** - Illustration of lightbulb with flower petals
   - WHERE USED: Ideas tab when no suggestions available

4. **empty-uploads.png** - Illustration of upward arrow with photo frame
   - WHERE USED: Upload tab when no content uploaded

5. **empty-social.png** - Illustration of speech bubbles with checkmark
   - WHERE USED: Social tab when no activity

All illustrations should use orange accent color (#FF6B35) with soft cream backgrounds, simple line-art style.