# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Server
- `npm run dev` - Start Vite development server on port 3000
- `npm run build` - Build the production application 
- `npm run preview` - Preview the production build locally
- `npm run server` - Run the Node.js Express server (server.js)

### Installation
- `npm ci` - Clean install dependencies (recommended for production)
- `npm install` - Install dependencies

## Architecture Overview

FINZN is a personal finance management web application built with modern vanilla JavaScript and a modular architecture.

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini AI API
- **Machine Learning**: TensorFlow.js
- **Charts**: Chart.js
- **Icons**: Phosphor Icons
- **Deployment**: Netlify

### Core Architecture

The application follows a modular manager pattern with the main `FinznApp` class orchestrating various managers:

#### Main Application (`src/main.js`)
- **FinznApp Class**: Central application controller
- Initializes all managers and coordinates their interactions
- Handles authentication flow and main application lifecycle

#### Core Managers (`src/modules/`)
- **AuthManager**: Handles user authentication with Supabase
- **DataManager**: Manages all financial data (expenses, income, goals, budgets)
- **UIManager**: Handles DOM manipulation and UI updates
- **NavigationManager**: Manages SPA navigation between sections
- **ModalManager**: Handles modal dialogs throughout the app
- **ThemeManager**: Manages light/dark theme switching
- **ChartManager**: Handles Chart.js visualizations
- **BudgetManager**: Manages budget creation and tracking
- **AIBudgetManager**: AI-powered budget analysis and recommendations
- **CalendarManager**: Financial calendar and event management
- **ChatManager**: AI chat assistant integration
- **ReportManager**: Financial report generation
- **UserProfileManager**: User profile management

#### Database Structure (Supabase)
Key tables include:
- `expenses` - User expenses with installment support
- `income` - Fixed and extra income tracking  
- `goals` - Savings goals and progress
- `budgets` - Budget definitions and limits
- `categories` - Expense categories
- `spending_limits` - Monthly spending limits per category
- `user_profiles` - Extended user information

### Key Features Architecture

#### Financial Data Management
- Monthly-based expense tracking with installment support
- Multiple income types (fixed salary, extra income)
- Goal-based savings with progress tracking
- Budget creation with AI-powered insights

#### AI Integration
- **Google Gemini**: Powers the chat assistant and financial reports
- **TensorFlow.js**: Client-side ML for spending predictions
- Smart budget recommendations based on spending patterns

#### Authentication & Security
- Supabase authentication with email/password
- Row Level Security (RLS) policies
- Environment-based configuration with fallback to mock mode

#### UI/UX Design
- Responsive design with mobile-first approach
- Dark/light theme support
- Single Page Application (SPA) with section-based navigation
- Progressive Web App features

### Development Patterns

#### Module Communication
- All modules expose their functionality through their manager classes
- The main `FinznApp` class serves as the central coordinator
- Event-driven communication between UI components and data layer

#### Data Flow
1. User interactions trigger methods in `FinznApp`
2. `FinznApp` delegates to appropriate managers
3. Managers update data via `DataManager`
4. UI updates triggered through `UIManager`
5. Charts and visualizations updated via `ChartManager`

#### Error Handling
- Graceful degradation when Supabase is not configured
- Mock clients for development without backend
- User-friendly error messages through `UIManager.showAlert()`

## Environment Variables

Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Note: The app will run in mock mode if Supabase variables are not configured.

## Development Workflow

1. The app initializes through `src/main.js` when DOM loads
2. Authentication is checked first via `AuthManager`
3. If authenticated, user data is loaded through `DataManager`
4. Dashboard is updated with current financial information
5. All UI interactions are handled through event delegation in the main app

## File Structure Notes

- `index.html` - Single page application entry point with all modals
- `src/main.js` - Application entry point and main controller
- `src/modules/` - All feature modules organized by functionality
- `src/config/supabase.js` - Database configuration with fallback
- `src/styles/` - CSS organized by features and themes
- `supabase/migrations/` - Database schema and migrations
- `netlify.toml` - Deployment and security configuration

## Testing

Currently no formal test framework is configured. Manual testing is performed through the development server.