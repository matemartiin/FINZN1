# FINZN - Personal Finance Management App

A modern, AI-powered personal finance management application built with vanilla JavaScript and Supabase.

## 🚀 Features

### Core Functionality
- **Expense Tracking**: Record and categorize expenses with installment support
- **Income Management**: Track fixed and extra income sources
- **Budget Management**: Create and monitor budgets with AI recommendations
- **Goal Setting**: Set and track savings goals with progress visualization
- **Financial Reports**: Generate AI-powered financial insights and reports
- **Calendar Integration**: Schedule and track financial events
- **Smart Alerts**: Get notified about spending limits and budget overruns

### AI-Powered Features
- **Budget Analysis**: AI-driven budget recommendations using TensorFlow.js
- **Spending Predictions**: Machine learning models for expense forecasting
- **Financial Insights**: Gemini AI integration for personalized financial advice
- **Smart Chat**: AI assistant for financial questions and guidance

### Technical Features
- **Real-time Data**: Live updates with Supabase integration
- **Responsive Design**: Mobile-first design with PWA capabilities
- **Dark Mode**: System-aware theme switching
- **Data Export/Import**: CSV import/export functionality
- **Offline Support**: Service worker for offline functionality
- **Security**: Row-level security with Supabase authentication

## 🛠️ Technology Stack

### Frontend
- **Vanilla JavaScript** (ES6+)
- **CSS3** with custom properties and modern features
- **Chart.js** for data visualization
- **TensorFlow.js** for machine learning
- **Vite** for build tooling

### Backend & Services
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Google Gemini AI** for intelligent insights
- **Netlify** for deployment and hosting

### Development Tools
- **ESLint** for code linting
- **Prettier** for code formatting
- **Vite** for development server and building
- **Git** for version control

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Google AI API key (for Gemini integration)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/finzn.git
   cd finzn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   Run the Supabase migrations:
   ```bash
   # In your Supabase dashboard, run the SQL files in order:
   # - supabase/migrations/20250713013955_fading_desert.sql
   # - supabase/migrations/20250807173901_autumn_smoke.sql
   # - supabase/migrations/20250807183339_silent_swamp.sql
   # - supabase/migrations/20250808172203_green_night.sql
   # - supabase/migrations/20250808180036_yellow_valley.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
finzn/
├── public/                 # Static assets
│   ├── isotipo.png        # App logo
│   ├── mascota-finzn.png  # Mascot image
│   └── robot-chat.png     # Chat bot avatar
├── src/                   # Source code
│   ├── config/           # Configuration files
│   │   └── supabase.js   # Supabase client setup
│   ├── modules/          # Core application modules
│   │   ├── ai-budget.js  # AI budget analysis
│   │   ├── auth.js       # Authentication management
│   │   ├── budget.js     # Budget management
│   │   ├── calendar.js   # Calendar functionality
│   │   ├── charts.js     # Chart visualization
│   │   ├── chat.js       # AI chat assistant
│   │   ├── contextual-bar.js # Contextual filtering
│   │   ├── data.js       # Data management
│   │   ├── modals.js     # Modal management
│   │   ├── navigation.js # Navigation handling
│   │   ├── reports.js    # Report generation
│   │   ├── theme.js      # Theme management
│   │   ├── ui.js         # UI management
│   │   └── user-profile.js # User profile management
│   ├── styles/           # Stylesheets
│   │   └── main.css      # Main stylesheet
│   └── main.js           # Application entry point
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
├── index.html            # Main HTML file
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── netlify.toml          # Netlify deployment config
└── README.md             # This file
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Enable email authentication
3. Run the provided SQL migrations
4. Configure RLS policies (included in migrations)
5. Add your project URL and anon key to environment variables

### Google AI Setup
1. Get a Gemini API key from Google AI Studio
2. Add the API key to your environment variables
3. Configure usage limits as needed

### Netlify Deployment
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy using the provided `netlify.toml` configuration

## 🎨 Customization

### Theming
The app uses CSS custom properties for theming. Modify `src/styles/main.css`:

```css
:root {
  --primary-color: #C8B6FF;
  --secondary-color: #A7C7E7;
  /* ... other variables */
}
```

### Adding New Features
1. Create a new module in `src/modules/`
2. Import and initialize in `src/main.js`
3. Add corresponding UI elements and styles
4. Update database schema if needed

## 📊 Database Schema

### Core Tables
- **expenses**: User expense records with installment support
- **incomes**: Fixed and extra income tracking
- **goals**: Savings goals with progress tracking
- **budgets**: Budget configurations with AI insights
- **categories**: Custom expense categories
- **user_profiles**: Extended user information

### AI Tables
- **budget_insights**: AI-generated recommendations
- **budget_alerts**: Smart notifications and alerts
- **spending_patterns**: Analyzed spending behaviors

## 🤖 AI Features

### Budget Analysis
- Uses TensorFlow.js for local machine learning
- Analyzes spending patterns and trends
- Generates personalized budget recommendations
- Predicts future expenses based on historical data

### Chat Assistant
- Powered by Google Gemini AI
- Provides financial advice and insights
- Answers questions about budgeting and saving
- Offers contextual help based on user data

## 🔒 Security

### Authentication
- Supabase Auth with email/password
- Row Level Security (RLS) for data isolation
- Secure API key management
- Session management and refresh tokens

### Data Protection
- All user data is isolated using RLS policies
- API keys stored as environment variables
- Input validation and sanitization
- XSS protection throughout the application

## 🚀 Deployment

### Netlify (Recommended)
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### Manual Deployment
1. Build the project: `npm run build`
2. Upload `dist/` folder to your hosting provider
3. Configure environment variables on the server
4. Set up HTTPS and security headers

## 🧪 Testing

### Running Tests
```bash
npm test  # Run test suite (when implemented)
npm run lint  # Run ESLint
```

### Manual Testing
1. Test all authentication flows
2. Verify data persistence across sessions
3. Test responsive design on various devices
4. Validate AI features with sample data
5. Check accessibility with screen readers

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a pull request

### Code Standards
- Use ESLint configuration provided
- Follow existing code style and patterns
- Add comments for complex logic
- Update documentation for new features
- Ensure responsive design compatibility

### Bug Reports
Please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information
- Console errors (if any)
- Screenshots (if applicable)

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Google AI** for the Gemini API integration
- **TensorFlow.js** for client-side machine learning capabilities
- **Chart.js** for beautiful data visualizations
- **Netlify** for seamless deployment and hosting

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues for solutions

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Bank account integration
- [ ] Investment tracking
- [ ] Multi-currency support
- [ ] Advanced reporting dashboard
- [ ] Social features (family budgets)
- [ ] Cryptocurrency tracking
- [ ] Bill reminders and automation

### Technical Improvements
- [ ] Unit and integration tests
- [ ] Performance optimizations
- [ ] Enhanced offline support
- [ ] Advanced AI models
- [ ] Real-time collaboration
- [ ] API rate limiting
- [ ] Enhanced security features

---

**FINZN** - Your intelligent financial companion 🚀💰