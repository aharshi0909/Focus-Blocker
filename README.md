# 🎯 Focus Blocker - Thorium Extension

A powerful Thorium/Chrome extension that helps you stay focused by blocking distracting websites during designated time periods. 

## Features

✨ **Hour-Based Timers**: Set focus sessions from 1 to 10 hours with a single click

🔒 **Smart Blocking**: Blocks all websites except your allowed list

⏱️ **Persistent Timers**: Timer state persists across browser restarts using absolute timestamps

🎨 **Beautiful UI**: Modern gradient design with smooth animations

⚙️ **Easy Management**: Quick add/remove sites from whitelist

📊 **Import/Export**: Backup and restore your allowed sites list

🚀 **Fast & Lightweight**: Uses declarativeNetRequest API for efficient blocking

## Installation

1. **Download or Clone** this repository to your local machine

2. **Open Thorium** (or any Chromium-based browser)

3. **Navigate to Extensions**:
   - Go to `thorium://extensions/` (or `chrome://extensions/`)
   - Enable "Developer mode" (toggle in top-right corner)

4. **Load the Extension**:
   - Click "Load unpacked"
   - Select the folder containing this extension
   - The Focus Blocker icon should appear in your extensions bar

## Usage

### Starting a Focus Session

1. Click the Focus Blocker icon in your browser toolbar
2. Choose your focus duration (1-10 hours)
3. All websites except your allowed list will be blocked
4. Stay focused! 🎯

### Managing Allowed Sites

**Quick Add (from popup):**
- Enter a domain (e.g., `github.com`) in the input field
- Click "Add" to allow the site

**From Blocked Page:**
- When you visit a blocked site, you can add it to your allowed list directly

**Bulk Management (in options):**
- Click "More Options" in the popup
- Add/remove multiple sites
- Import/export your allowed sites list

### Stopping a Session

- Click the Focus Blocker icon
- Click the "Stop Timer" button to end your focus session early

## How It Works

### Time-Based Persistence

Unlike many website blockers, Focus Blocker uses **absolute timestamps** instead of elapsed time:

- When you start a 3-hour timer, the extension calculates the exact time it should end
- This end time is stored in `chrome.storage.local`
- When you restart Thorium, the extension checks if the end time has passed
- **Result**: Your timer continues working even if you close and reopen the browser!

### Blocking Mechanism

The extension uses Chrome's `declarativeNetRequest` API for efficient, low-overhead blocking:

- Creates dynamic rules that redirect blocked sites to a custom page
- Excludes your allowed domains from the blocking rule
- Updates rules in real-time when you modify your allowed list

## File Structure

```
focus-blocker/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (timer & blocking logic)
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.js            # Options page functionality
├── blocked.html          # Page shown when site is blocked
├── blocked.js            # Blocked page functionality
├── styles.css            # Shared styles
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Technical Details

### Storage Schema

```javascript
{
  "timerEndTime": 1702234567890,  // Absolute timestamp (ms)
  "timerDuration": 3600000,       // Duration in ms
  "isActive": true,               // Blocking status
  "allowedSites": ["github.com"], // Whitelist
  "blockMessage": "Custom message"
}
```

### Key Features

- **Manifest V3**: Uses latest extension API
- **Persistent State**: Survives browser restarts
- **Real-time Updates**: Changes take effect immediately
- **Memory Efficient**: Minimal background processing
- **Privacy Focused**: All data stored locally

## Permissions

The extension requires the following permissions:

- `storage`: Store timer state and allowed sites
- `declarativeNetRequest`: Block websites efficiently
- `tabs`: Detect current tab for quick actions
- `<all_urls>`: Apply blocking rules to all websites

## Customization

### Changing the Block Message

1. Click the Focus Blocker icon
2. Click "More Options"
3. Edit the "Block Message" field
4. Click "Save Message"

### Modifying Timer Options

To add more timer options or change intervals, edit the `popup.html` file and add/modify buttons in the `.button-grid` section.

## Troubleshooting

**Timer doesn't persist after restart:**
- Check that the extension has storage permissions
- Look for errors in `thorium://extensions/` → Details → Inspect views: service worker

**Sites not blocking:**
- Ensure timer is active (check popup status)
- Verify the site isn't in your allowed list
- Try reloading the extension

**Can't add site to allowed list:**
- Make sure you're entering just the domain (e.g., `example.com` not `https://example.com/path`)

## Development

Want to contribute or modify the extension? Here's how to get started:

1. Make changes to the source files
2. Reload the extension in `thorium://extensions/`
3. Test your changes
4. Check the service worker console for debugging logs

## License

This project is open source and available for personal and educational use.

## Credits

Created with ❤️ for productivity enthusiasts who want to stay focused and avoid distractions.

---

**Stay focused, stay productive! 🎯**
