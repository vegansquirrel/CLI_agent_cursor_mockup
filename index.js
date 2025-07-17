import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import 'dotenv/config'; 

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, function (err, stdout, stderr) {
      if (err) {
        return reject(err);
      }
      resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
    });
  });
}

const TOOLS_MAP = {
  executeCommand: executeCommand,
};

const SYSTEM_PROMPT = `
You are a helpful AI Assistant who is designed to resolve user queries.
You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

In the start phase, user gives a query to you.
Then, you THINK how to resolve that query at least 3-4 times and make decisions.
If there is a need to call a tool, you call an ACTION event with tool name and input.
If there is an action call, wait for the OBSERVE that is output of the tool.
Based on the OBSERVE from prev step, you either output or repeat the loop.

Rules:
- Always wait for next step.
- Always output a single step and wait for the next step.
- Output must be strictly JSON
- Only call tool action from Available tools only.
- Strictly follow the output format in JSON

Available Tools:
- executeCommand(command): string Executes a given linux command

Example:
START: List files in current directory
THINK: The user wants to list files in the current directory.
THINK: I need to use the executeCommand tool with the 'ls' command.
ACTION: Call Tool executeCommand(ls)
OBSERVE: file1.txt file2.js README.md
THINK: The executeCommand tool returned the list of files successfully.
OUTPUT: Here are the files in the current directory: file1.txt, file2.js, README.md

Output Format:
For THINK: {"step": "think", "content": "your thinking process"}
For ACTION: {"step": "action", "tool": "toolName", "input": "toolInput"}
For OUTPUT: {"step": "output", "content": "your final response"}
`;

async function init() {
  const userQuery = process.argv[2] || 'List files in current directory';
  
  const messages = [
    {
      role: 'user',
      content: userQuery,
    },
  ];

  console.log(`🚀 Starting query: ${userQuery}`);

  while (true) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages,
      });

      const responseContent = response.content[0].text;
      let parsed_response;
      
      try {
        parsed_response = JSON.parse(responseContent);
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', responseContent);
        console.error('JSON Error:', jsonError.message);
        break;
      }
      
      // Add the AI's response to the message history
      messages.push({
        role: 'assistant',
        content: responseContent,
      });

      if (parsed_response.step && parsed_response.step === 'think') {
        console.log(`🧠 THINK: ${parsed_response.content}`);
        
        // Add a user message to continue the conversation
        messages.push({
          role: 'user',
          content: 'Continue to the next step.',
        });
        continue;
      }

      if (parsed_response.step && parsed_response.step === 'output') {
        console.log(`🤖 OUTPUT: ${parsed_response.content}`);
        break;
      }

      if (parsed_response.step && parsed_response.step === 'action') {
        const tool = parsed_response.tool;
        const input = parsed_response.input;

        if (!TOOLS_MAP[tool]) {
          console.error(`❌ Unknown tool: ${tool}`);
          break;
        }

        console.log(`⛏️ ACTION: Calling ${tool} with input: ${input}`);
        
        try {
          const value = await TOOLS_MAP[tool](input);
          console.log(`📋 OBSERVE: ${value}`);

          // Add the observation to the message history
          messages.push({
            role: 'user',
            content: `OBSERVE: ${value}`,
          });
        } catch (error) {
          console.error(`❌ Tool execution failed: ${error.message}`);
          messages.push({
            role: 'user',
            content: `OBSERVE: Error - ${error.message}`,
          });
        }
        continue;
      }

      // If we get here, the response format was unexpected
      console.error('❌ Unexpected response format:', parsed_response);
      break;

    } catch (error) {
      console.error('❌ Error in main loop:', error);
      break;
    }
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

init().catch(console.error);