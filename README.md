📘 Website Highlight Saver – Chrome Extension

A Chrome extension that allows users to highlight text on any webpage, save those highlights locally, and generate AI-powered summaries using a backend API (Gemini).

🚀 Features
1. Highlight & Save Text

Users can highlight any text on any webpage.

A “Save Highlight?” bubble appears beside the selected text.

Highlighted text gets saved to local storage using Chrome’s storage API.

2. View Saved Highlights

Clicking the extension icon opens a popup.

The popup displays:

All saved highlights

Source URL

Timestamp

Buttons for Copy, Delete, or Open Page

3. AI Summaries (Gemini)

The popup includes a Summarize button.

Highlights are sent to a backend server.

The server uses Google Gemini (gemini-2.0-flash) to generate a line-by-line summarized output.

4. Fully Local + Secure

Highlights are stored only on the user’s device.

The API key stays secure inside the backend and is never exposed in the extension.

🛠️ Installation & Setup
1. Install Dependencies (Backend Server)
cd server
npm install

2. Add Environment Variables

Create a .env file inside the server folder:

GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001


Get the key from: https://aistudio.google.com/app/apikey

3. Start the Backend Server
node index.js


Server will run at:

http://localhost:3001

🧩 Load the Chrome Extension

Open Chrome and go to:

chrome://extensions


Enable Developer Mode (top right).

Click Load unpacked.

Select the extension/ folder.

The extension icon will now appear in the Chrome toolbar.