# Project Timer MCP Server

A simple **Model Context Protocol (MCP)** server for tracking how long you spend on different tasks in Claude Code.

## What is This?

My MCP server is a simple Project Timer for Claude Code that helps you track how long you spend on different tasks. The server includes two tools: one that starts a timer for a named task and another that stops the timer and returns the elapsed time. It is useful because it allows you to monitor how much time you spend on different activities.
To set it up, first run npm install inside your project folder to install the required dependencies. Then run node index.js to make sure the server starts without errors. After confirming it runs correctly, register it with Claude Code using the claude mcp add command, replacing the path with the full absolute path to your index.js file. Finally, open Claude Code and type /mcp to reconnect your server.
The only issues I encountered were a few small errors in the package.json file when connecting the MCP server.

