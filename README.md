# Entropy AI - Code Assistant

Entropy AI is a powerful code assistant that helps you review, enhance, and translate code between different programming languages.

## Features

### Code Review
AI-powered analysis of your code that provides:
- Code quality assessment
- Performance recommendations
- Best practices suggestions
- Security improvements
- Beautiful, formatted output

### Code Enhancement
Automatically improve your code with:
- Formatting & style improvements
- Performance optimization
- Documentation generation
- Security vulnerability fixes

### Code Translation
Translate code between multiple programming languages:
- Preserves functionality and logic
- Maintains comments (translated)
- Uses idiomatic patterns in target language
- Supports 12+ programming languages

## Technology

- Frontend: React + Vite, Tailwind CSS
- Authentication: Firebase Auth
- Storage: Firestore
- AI: Google Gemini Pro 1.5

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on the provided `.env.example`:
   ```
   cp .env.example .env
   ```
4. Obtain the necessary API keys:
   - **Firebase**: Create a project at [Firebase Console](https://console.firebase.google.com/)
   - **Gemini AI**: Get an API key from [Google AI Studio](https://aistudio.google.com/)
5. Update your `.env` file with the actual keys
6. Start the development server: `npm run dev`

## Environment Variables

The application uses the following environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |

## Gemini Integration

This application uses Google's Gemini Pro 1.5 model to provide advanced AI capabilities for code processing:

1. **Code Review**: Utilizes Gemini to analyze code and provide detailed, professional feedback
2. **Code Enhancement**: Employs Gemini to apply selected improvements to your code
3. **Code Translation**: Leverages Gemini's multimodal capabilities to translate between programming languages

Each feature implements graceful fallbacks if the Gemini API is unavailable.

## Security

This project includes several security measures to protect sensitive data:

1. **Environment Variables**: All API keys and secrets are stored in `.env` files which are excluded from Git
2. **Pre-commit Checks**: Automatic scanning for accidentally committed secrets using Husky
3. **Fallback Mechanisms**: The application never fails due to missing API keys

To initialize the pre-commit hooks after cloning:

```
npm run prepare
```

If you need to bypass the pre-commit checks (not recommended):

```
git commit --no-verify
```

## License

MIT
