/**
 * PROJECT TIMER MCP SERVER
 *
 * What is MCP?
 * MCP (Model Context Protocol) is a protocol that lets Claude use tools and access resources.
 * This server acts as a "plugin" that provides Claude with timer tools.
 * Claude can call these tools to start and stop timers for tracking task duration.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";

// Configuration: where to store timer data
const TIMERS_FILE = "./timers.json";

/**
 * HELPER FUNCTION: Load timers from JSON file
 *
 * This reads the timers.json file and returns the data as a JavaScript object.
 * If the file doesn't exist, it returns an empty object {}.
 */
function loadTimers() {
  try {
    if (fs.existsSync(TIMERS_FILE)) {
      const data = fs.readFileSync(TIMERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading timers:", error);
  }
  return {};
}

/**
 * HELPER FUNCTION: Save timers to JSON file
 *
 * This takes a JavaScript object and writes it to timers.json.
 * JSON.stringify() converts the object to JSON format.
 * The third parameter (2) adds pretty-printing for readability.
 */
function saveTimers(timers) {
  try {
    fs.writeFileSync(TIMERS_FILE, JSON.stringify(timers, null, 2));
  } catch (error) {
    console.error("Error saving timers:", error);
  }
}

/**
 * HELPER FUNCTION: Format elapsed time
 *
 * Takes milliseconds and converts to "X minutes, Y seconds" format.
 * Example: 754000 ms becomes "12 minutes, 34 seconds"
 */
function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} minutes, ${seconds} seconds`;
}

/**
 * TOOL 1: START_TIMER
 *
 * This tool starts a timer for a task by storing the current timestamp.
 * It saves the task name and start time to the timers.json file.
 */
function startTimer(taskName) {
  const timers = loadTimers();

  // Check if a timer for this task is already running
  if (timers[taskName]) {
    return `Timer for "${taskName}" is already running. Stop it first before starting a new one.`;
  }

  // Record the current time as the start time
  const startTime = Date.now();
  timers[taskName] = { startTime };

  // Save the updated timers to the file
  saveTimers(timers);

  // Return confirmation message with the task name and formatted timestamp
  const timestamp = new Date(startTime).toLocaleString();
  return `Timer started for "${taskName}" at ${timestamp}`;
}

/**
 * TOOL 2: STOP_TIMER
 *
 * This tool stops a timer by calculating how much time has passed
 * since it was started, then removes it from storage.
 */
function stopTimer(taskName) {
  const timers = loadTimers();

  // Check if a timer exists for this task
  if (!timers[taskName]) {
    return `No timer found for "${taskName}". Start one first with start_timer.`;
  }

  // Get the start time from storage
  const startTime = timers[taskName].startTime;

  // Calculate how many milliseconds have passed
  const stopTime = Date.now();
  const elapsedMilliseconds = stopTime - startTime;

  // Remove the timer entry from storage
  delete timers[taskName];
  saveTimers(timers);

  // Format the result nicely and return it
  const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
  return `Timer stopped for "${taskName}". Elapsed time: ${elapsedFormatted}`;
}

/**
 * CREATE THE MCP SERVER
 *
 * This creates a server instance that Claude can communicate with.
 * The server will listen for requests to list available tools and call them.
 *
 * capabilities: tells the MCP that this server supports tools.
 */
const server = new Server(
  {
    name: "project-timer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * REGISTER TOOL DEFINITIONS
 *
 * This tells Claude what tools are available and what inputs they need.
 * Claude will see these tool definitions and can call them.
 *
 * Each tool needs:
 * - name: the tool identifier
 * - description: what the tool does
 * - inputSchema: what inputs the tool accepts
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "start_timer",
        description: "Start a timer for a task. Saves the start time to track when work began.",
        inputSchema: {
          type: "object",
          properties: {
            taskName: {
              type: "string",
              description: "The name of the task to track (e.g., 'Fix login bug', 'Design homepage')",
            },
          },
          required: ["taskName"],
        },
      },
      {
        name: "stop_timer",
        description: "Stop a timer for a task. Returns the total elapsed time.",
        inputSchema: {
          type: "object",
          properties: {
            taskName: {
              type: "string",
              description: "The name of the task to stop timing",
            },
          },
          required: ["taskName"],
        },
      },
    ],
  };
});

/**
 * HANDLE TOOL CALLS
 *
 * When Claude calls one of our tools, this handler is triggered.
 * It checks which tool was called and executes the corresponding function.
 * Then it returns the result back to Claude.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "start_timer") {
      // Call the start timer function with the task name
      const result = startTimer(args.taskName);
      return {
        content: [{ type: "text", text: result }],
      };
    } else if (name === "stop_timer") {
      // Call the stop timer function with the task name
      const result = stopTimer(args.taskName);
      return {
        content: [{ type: "text", text: result }],
      };
    } else {
      // Unknown tool
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
  } catch (error) {
    // If something goes wrong, return the error message
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

/**
 * START THE SERVER
 *
 * This connects the server to stdin/stdout so it can communicate with Claude.
 * StdioServerTransport wraps the Node.js streams for MCP communication.
 * The server will now be ready to receive requests and handle tool calls.
 */
async function main() {
  console.error("[project-timer] MCP server starting...");

  // Create a transport that uses stdin/stdout for communication
  const transport = new StdioServerTransport();

  // Connect the server using the transport
  await server.connect(transport);

  console.error("[project-timer] Server connected and ready!");
}

// Run the server
main().catch(console.error);
