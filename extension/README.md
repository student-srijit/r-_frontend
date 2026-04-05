# Research Plus Browser Extension

Manifest V3 browser extension to analyze research links directly in-browser and push insights into your Research Plus workflow.

## Features

- Login with your Research Plus account
- Analyze current page/link with selected research workspace
- Sync session from website tab (auth token + saved LLM config)
- Rich in-popup results:
  - detailed summary
  - key points
  - important concepts
  - practical applications
  - discussion questions
- Context menu action: Analyze with Research Plus
- Configurable backend/frontend URLs

## Local Installation (Development)

1. Open Chrome and go to `chrome://extensions/`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `extension` folder from this project.

## Usage

1. Log in to Research Plus website.
2. Save your LLM credentials on the website research page.
3. Open any research URL.
4. Click extension icon.
5. Click Use Saved Session From Website.
6. Select a research work.
7. Click Analyze.

## Configuration

Default values in popup settings:

- Backend API: `http://localhost:5001/api`
- Frontend URL: `http://localhost:3000`

You can change both in extension popup Settings.

## File Structure

```text
extension/
├── manifest.json
├── README.md
├── PRIVACY_POLICY.md
├── CHROME_WEB_STORE_SUBMISSION.md
├── images/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── popup.html
    ├── popup.js
    └── background.js
```

## Security Notes

- Auth token is stored in extension local storage.
- API key can be synced from website session on explicit user action.
- Analysis requests are sent only to configured backend API endpoint.

## Packaging

Create upload zip from workspace root:

```powershell
Compress-Archive -Path extension/* -DestinationPath extension/research-plus-extension-v1.0.1.zip -Force
```
