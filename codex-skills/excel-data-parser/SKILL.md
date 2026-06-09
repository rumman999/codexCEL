---
name: Excel Data to Chart Parser
description: Instructs the Codex agent on how to parse uploaded .xlsx files and format the data for OpenAI chart generation.
version: 1.0.0
author: Deploy_Before_Elections
---

# Skill Instructions

## Objective
When requested to build or modify the data pipeline for codexCEL, the agent must follow this workflow to ensure data is safely extracted from SQLite and sent to the OpenAI API for graph generation.

## Best Practices
1. **Extraction:** Always use the `xlsx` npm package to convert spreadsheet rows into flat, lightweight JSON objects to save token space.
2. **Database:** Store the JSON string temporarily in the `database.sqlite` file.
3. **Prompt Formatting:** When sending the payload to OpenAI, append this system instruction:
   > "Return a JSON array containing the chart type (bar, line, pie) and the mapped labels/data arrays."
4. **Validation:** Ensure the resulting JSON from OpenAI is caught and parsed cleanly before sending it to the Vite frontend for Recharts rendering.

## Optional Assets
- View the `/scripts` directory for the `seed.js` mock data generator.
- View the `/references` directory for the Recharts JSON coordinate formatting guide.