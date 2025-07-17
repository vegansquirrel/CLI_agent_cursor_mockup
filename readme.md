# CLI AI Agent

This project is a command-line AI assistant that uses the Anthropic Claude API to resolve user queries and execute Linux commands.

## Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repo-url>
   cd CLI\ AI\ agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your Anthropic API key:**
   - Create a file named `.env` in the project root directory.
   - Add the following line to your `.env` file (replace `your_api_key_here` with your actual API key):
     ```env
     ANTHROPIC_API_KEY=your_api_key_here
     ```

## Running the CLI AI Agent

You can run the agent with a custom query as follows:

```bash
node index.js "Your query here"
```

If you do not provide a query, it will default to listing files in the current directory.

**Example:**
```bash
node index.js "List all running processes"
```

## Notes
- Requires Node.js v12 or higher.
- Make sure your API key is valid and has access to the Anthropic Claude API.
- The agent will output its reasoning and actions step by step in the terminal.

This is what the package.json should look like.
```
{
  "type": "module",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.56.0",
    "dotenv": "^17.2.0"
  }
}
```