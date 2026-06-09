# codexCEL Skills & Agent Workflows

This document defines the specialized skills and workflows used by our autonomous agents.

## 1. Zero-Code Development Agent
**Description:** The entire codexCEL platform was built using an applied agentic workflow, driven by Codex AI, without writing a single line of code manually.
- **Workflow:** We leveraged `AGENTS.md` and continuous natural language prompting to autonomously scaffold the Vite frontend, Express backend, and SQLite database.
- **Outcome:** The AI navigated file creation, debugging, UI/UX refinement, and complex logic implementation entirely on its own.

## 2. Business Intelligence (BI) Analyst Skill
**Description:** This skill empowers the application to transform raw spreadsheet data into natural language insights and dynamic visualizations, helping everyday users perform complex BI analysis easily.
- **Data Ingestion Workflow:** Parses uploaded `.xlsx` files into raw JSON arrays using `multer` and `xlsx`.
- **Token Optimization:** Automatically slices and truncates large datasets to the first 50 rows, appending truncation metadata. This strictly controls token costs while preserving analytical integrity.
- **Inference Engine:** Uses the `gpt-4o` Responses API.

## 3. Dynamic Visualization Rendering
**Description:** The AI is instructed to output a strict JSON structure whenever a user requests a chart or graph.
- **Format Constraint:** 
  ```json
  {
    "chartType": "bar", // or "line", "pie"
    "data": [{"name": "Jan", "value": 400}, {"name": "Feb", "value": 300}]
  }
  ```
- **Execution:** The frontend's `<ChatMessage />` intercepts this block, strips it from the markdown text, and injects the JSON payload into a Recharts `<ChartRenderer />` component to render gorgeous, responsive interactive charts on the fly.
