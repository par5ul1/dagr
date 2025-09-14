# Dagr

> **Intelligent Calendar Automation with AI**  
> Transform your goals into scheduled reality with modern LLMs

Dagr is a smart calendar automation system that analyzes your personal goals, motivations, and existing calendar events to automatically schedule optimal time blocks for achieving what matters most to you.

## What Makes Dagr Special

- **AI-Powered Scheduling**: Uses advanced language models to understand your preferences and create personalized weekly schedules
- **Goal-Driven Planning**: Connects your aspirations directly to your calendar with intelligent time allocation
- **Smart Calendar Integration**: Seamlessly works with Google Calendar, creating a dedicated "Dagr Calendar" for AI-generated events
- **Conversational Updates**: Chat with the AI to modify your schedule on-the-fly
- **Real-time Optimization**: Continuously learns from your patterns and preferences

## How It Works

1. **Onboarding**: Tell Dagr about yourself - your role, work schedule, motivations, and challenges
2. **Goal Setting**: Create and prioritize your personal and professional goals
3. **Calendar Sync**: Connect your Google Calendar so Dagr understands your existing commitments
4. **AI Analysis**: Dagr's LLM agents analyze your available time slots, energy patterns, and goal priorities
5. **Automated Scheduling**: Get perfectly timed blocks for your goals, respecting your existing events
6. **Continuous Refinement**: Chat with Dagr to adjust schedules and improve future planning

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database & serverless functions)
- **AI**: OpenRouter integration with Sonoma Dusk Alpha LLM
- **Authentication**: Better Auth with Google OAuth
- **Calendar**: Google Calendar API integration
- **UI Components**: Radix UI, Lucide React icons

## Prerequisites

- Node.js 18+ 
- Google Cloud Console project with Calendar API enabled
- OpenRouter API key
- Convex account

## Environment Setup

Create `.env.local` file:

```bash
# Convex
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Authentication
SITE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# AI/LLM
OPENROUTER_API_KEY=your-openrouter-api-key

# Environment
NODE_ENV=development
```

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/dagr.git
   cd dagr
   pnpm install
   ```

2. **Setup Convex**
   ```bash
   npx convex dev
   ```

3. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Calendar API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` to redirect URIs

4. **Start Development**
   ```bash
   pnpm dev
   ```

5. **Open Application**
   - Navigate to `http://localhost:3000`
   - Complete onboarding flow
   - Start planning your week!

## Project Structure

```
dagr/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── app/            # App-specific components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── guards/             # Authentication & onboarding guards
│   └── utils/              # Utility functions
├── convex/                 # Backend functions & schema
│   ├── agent.ts           # LLM agent configuration
│   ├── calendar.ts        # Google Calendar integration
│   ├── goals.ts           # Goal management
│   └── schema.ts          # Database schema
└── package.json
```

## Core Features

### Goal Management
- Create prioritized goals with descriptions
- Track progress over time
- Select relevant goals for weekly planning

### AI-Powered Schedule Generation
- Analyzes existing calendar events
- Considers user persona and motivations
- Creates conflict-free time blocks
- Optimizes for energy levels and task grouping

### Google Calendar Integration
- Reads existing events from all calendars
- Creates dedicated "Dagr Calendar" for AI-generated events
- Automatic event creation with proper formatting

### Conversational Interface
- Chat with AI to modify existing schedules
- Request specific changes or preferences
- Real-time schedule updates

## Privacy & Security

- OAuth 2.0 secure authentication with Google
- Calendar access limited to read/write operations
- User data stored securely in Convex
- No sensitive information logged or exposed

## Development Commands

```bash
# Start development servers
pnpm dev                    # Both frontend and backend
pnpm dev:frontend          # Next.js only
pnpm dev:backend           # Convex only

# Code quality
pnpm lint                  # Run Biome linter
pnpm format               # Format code with Biome

# Production
pnpm build                # Build for production
pnpm start                # Start production server
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Convex](https://convex.dev) for real-time backend
- Powered by [OpenRouter](https://openrouter.ai) for LLM access
- UI components from [Radix UI](https://radix-ui.com)
- Icons by [Lucide](https://lucide.dev)

---

**Ready to transform your goals into reality?** Get started with Dagr today!