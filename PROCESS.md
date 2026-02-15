# Technical Process Documentation

## Architecture Overview

My MCP server is a simple Project Timer for Claude Code that helps you track how long you spend on different tasks. The server includes two tools: one that starts a timer for a named task and another that stops the timer and returns the elapsed time. It is useful because it allows you to monitor how much time you spend on different activities and better understand your productivity habits. This can help with time management, planning, and identifying tasks that take longer than expected. The design is intentionally simple, making it easy to understand and maintain, especially for beginners learning how MCP servers work.
To set it up, first run npm install inside your project folder to install the required dependencies. Then run node index.js to make sure the server starts without errors and is ready to accept connections. After confirming it runs correctly, register it with Claude Code using the claude mcp add command, replacing the path with the full absolute path to your index.js file. This ensures that Claude Code knows exactly where to find and execute your server. Finally, open Claude Code and type /mcp to reconnect your server and make the tools available for use.
The only issues I encountered were a few small errors in the package.json file while connecting the MCP server, but they were resolved by carefully reviewing the configuration and correcting formatting mistakes.

