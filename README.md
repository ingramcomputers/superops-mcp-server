# Superops.ai MCP Server

A Model Context Protocol (MCP) server that provides access to Superops.ai GraphQL API documentation. This server allows AI assistants and other MCP clients to query and explore the comprehensive Superops.ai MSP platform API.

## 🚀 Quick Start with GitMCP

Use this MCP server directly from GitHub without any installation:

### Claude Desktop Configuration

Add this to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "superops": {
      "command": "npx",
      "args": [
        "-y", 
        "mcp-remote",
        "https://gitmcp.io/ingramcomputers/superops-mcp-server"
      ]
    }
  }
}
```

### Alternative: Direct Installation

```bash
# Clone and install locally
git clone https://github.com/ingramcomputers/superops-mcp-server.git
cd superops-mcp-server
npm install
npm run build

# Add to Claude Desktop config:
{
  "mcpServers": {
    "superops": {
      "command": "node",
      "args": ["path/to/superops-mcp-server/build/index.js"]
    }
  }
}
```

## 🛠 Available Tools

This MCP server provides 8 powerful tools for exploring the Superops.ai GraphQL API:

### 1. `fetch_superops_documentation`
Loads the complete Superops.ai GraphQL API documentation and parses it for use.

**Usage:** `fetch_superops_documentation()`

### 2. `search_superops_docs`
Search within the documentation for specific operations, types, or concepts.

**Parameters:**
- `query` (required): Search term
- `type` (optional): Filter by 'queries', 'mutations', 'types', or 'all'

**Example:** `search_superops_docs({ query: "ticket", type: "queries" })`

### 3. `get_superops_query_info`
Get detailed information about a specific GraphQL query.

**Parameters:**
- `queryName` (required): Name of the query

**Example:** `get_superops_query_info({ queryName: "getTicket" })`

### 4. `get_superops_mutation_info`
Get detailed information about a specific GraphQL mutation.

**Parameters:**
- `mutationName` (required): Name of the mutation

**Example:** `get_superops_mutation_info({ mutationName: "createTicket" })`

### 5. `get_superops_type_info`
Get detailed information about a specific GraphQL type.

**Parameters:**
- `typeName` (required): Name of the type

**Example:** `get_superops_type_info({ typeName: "Ticket" })`

### 6. `list_superops_operations`
List all available GraphQL queries and mutations, organized by category.

**Parameters:**
- `operationType` (optional): 'queries', 'mutations', or 'all'

**Example:** `list_superops_operations({ operationType: "all" })`

### 7. `get_superops_api_endpoints`
Get Superops.ai API endpoints and authentication information.

**Usage:** `get_superops_api_endpoints()`

### 8. `generate_superops_request` 🆕
Generate complete, ready-to-use GraphQL requests with proper authentication headers.

**Parameters:**
- `operationName` (required): Name of the GraphQL operation
- `subdomain` (required): Your Superops.ai subdomain (e.g., "yourcompany")
- `apiToken` (required): Your Superops.ai API token (format: