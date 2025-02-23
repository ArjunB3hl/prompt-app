# AI Chat Application

A versatile chatbot application with advanced features including:
- Multi-model LLM support (GPT-3.5, GPT-4)
- Google integration (Gmail, Drive, Docs)
- Advanced prompting techniques
- Token usage analytics
- Dark/Light theme
- Real-time chat streaming

## Quick Start

```bash
git clone https://github.com/ArjunB3hl/prompt-app.git
cd prompt-app
npm install
```

## Configuration

1. Create `.env` file in root directory:
```env
OPENAI_API_KEY=your_openai_key
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:5030/oauth2callback
```

2. MongoDB Setup
   - **MacOS**: 
     ```bash
     brew tap mongodb/brew
     brew install mongodb-community
     brew services start mongodb-community
     ```
   - **Windows**: 
     - Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
     - Follow installation wizard
     - Start MongoDB service

3. Google Cloud Setup

### Step 1: Create Project
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing one
3. Note your Project ID

### Step 2: Enable APIs
Navigate to "APIs & Services" > "Library" and enable:
- Gmail API
- Google Drive API
- Google Docs API

### Step 3: Configure OAuth
1. Go to "APIs & Services" > "Credentials"
2. Configure OAuth consent screen:
   - Choose user type (External/Internal)
   - Add app information
   - Add scopes:
     ```
     https://mail.google.com/
     https://www.googleapis.com/auth/drive
     https://www.googleapis.com/auth/documents
     ```

3. Create OAuth 2.0 credentials:
   - Select "Web application"
   - Add authorized origins: `http://localhost:5030`
   - Add authorized redirect URI: `http://localhost:5030/oauth2callback`

## Features

### Prompting Techniques
- Few Shot Prompting
- Chain of Thought
- Self Consistency
- Role Playing
- React Prompting

### Token Analytics
- Real-time token usage tracking
- Visualization of prompt vs completion tokens
- Historical token usage analysis

### Google Integration
- Email composition and reading
- Document creation and editing
- Drive file management

## Development

```bash
# Start development server
npm run dev
```



## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push branch: `git push origin feature-name`
5. Submit pull request


