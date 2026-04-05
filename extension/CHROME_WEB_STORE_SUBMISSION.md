# Chrome Web Store Submission Guide

## 1. Package Ready

Current package version: 1.0.1
Manifest file: extension/manifest.json

## 2. Pre-Submission Checklist

1. Ensure backend production URL and frontend URL defaults are correct in popup settings flow.
2. Verify extension icons exist:
   - extension/images/icon16.png
   - extension/images/icon48.png
   - extension/images/icon128.png
3. Verify popup flow:
   - Login works
   - Use Saved Session From Website works when website tab is active
   - Analyze button returns rich results in popup
4. Verify context menu item appears on links.

## 3. Build Upload ZIP

From workspace root, run:

```powershell
Compress-Archive -Path extension/* -DestinationPath extension/research-plus-extension-v1.0.1.zip -Force
```

## 4. Chrome Web Store Listing Requirements

Prepare these assets before submission:

1. Store icon (128x128 PNG)
2. Screenshots (at least 1, recommended 3-5)
3. Detailed description and short description
4. Privacy policy URL (host PRIVACY_POLICY.md content on a public URL)
5. Support URL (optional but recommended)

## 5. Suggested Listing Text (Starter)

Short description:
Analyze research paper links directly in-browser and get structured summaries, concepts, and actionable insights.

Detailed description:
Research Plus helps users analyze technical links and research papers while connected to their Research Plus account. It supports account sync, website session sync, and in-popup analysis rendering with detailed summaries, key points, concepts, applications, and discussion questions.

## 6. Post-Publish Validation

1. Install from store on a clean Chrome profile.
2. Confirm login and sync behavior.
3. Confirm analyze flow and error messages.
4. Confirm no runtime errors in extension background or popup consoles.
