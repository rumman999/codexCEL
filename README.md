# codexCEL 📊

Friction-free Business Intelligence powered by OpenAI.

codexCEL is a modern, decoupled web application that transforms raw `.xlsx` spreadsheet data into actionable insights. By leveraging the OpenAI API, users can upload their financial or business data and query it using natural language to instantly receive text summaries and dynamic, interactive charts.

## Features

- **Seamless Data Ingestion:** Upload `.xlsx` files securely into a memory-based ingestion pipeline.
- **Natural Language Querying:** Ask plain-English questions about your spreadsheet data.
- **Dynamic Visualizations:** Automatically generates Recharts-compatible coordinates to render responsive bar, line, or pie charts.
- **Session Isolation:** Robust backend architecture ensuring users only interact with their own uploaded session data.
- **Cost-Controlled AI Integration:** Truncates massive datasets and utilizes deterministic system prompts to ensure low-latency and cost-effective API calls.

## Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (Enterprise white and Microsoft Excel-green theme)
- **Visualizations:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Server:** Express.js
- **Database:** SQLite (`better-sqlite3`)
- **File Parsing:** `xlsx` & `multer` (In-memory storage)

### AI & Data
- **Engine:** OpenAI API (`gpt-4o` / Responses API)
- **Agents:** Custom instruction pipelines for structured JSON outputs.

## Prerequisites

Before running the project locally, ensure you have the following installed:
- **Node.js:** v18 or higher.
- **OpenAI API Key:** A valid API key with access to `gpt-4o`.

## Local Setup Instructions ⚙️

Follow these steps to run the frontend and backend servers locally.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/codexcel.git
cd codexcel
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure your environment.

```bash
cd backend
npm install
```

Create an `.env` file in the `/backend` directory based on the `.env.example`:
```env
# /backend/.env
PORT=3001
NODE_ENV=development
DB_PATH=./data/database.sqlite
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and start the development server.

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## How It Works

1. **Upload:** The user uploads an `.xlsx` file via the frontend drag-and-drop interface.
2. **Ingestion:** The Express backend intercepts the file using `multer`'s memory storage, bypassing the disk.
3. **Parsing:** The `xlsx` library converts the first worksheet into a structured JSON array.
4. **Storage:** The JSON payload is stringified and stored in a local SQLite database, securely tied to the user's `sessionID`.
5. **Querying:** When the user sends a chat message, the backend retrieves the session's data, intelligently truncates it (to conserve tokens), and injects it into a strict system prompt.
6. **Response:** OpenAI processes the data and returns markdown text along with structured JSON chart parameters, which the frontend renders natively.

## OpenAI Codex Integration 🧠

Built for the **OpenAI Codex Community Challenge at UIU**, this project demonstrates applied agentic workflows. 

It specifically highlights the power of the `gpt-4o` model to act as a focused Business Intelligence assistant. The project includes a dedicated `/codex-skills` directory utilizing `skills.md` files to document and enforce the structured output schemas required for the frontend's dynamic rendering.
