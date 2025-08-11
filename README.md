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
        "@gitmcp/runtime",
        "https://github.com/YOUR_USERNAME/superops-mcp-server"
      ]
    }
  }
}
```

Replace `YOUR_USERNAME` with the actual GitHub username.

### Alternative: Direct Installation

```bash
# Clone and install locally
git clone https://github.com/YOUR_USERNAME/superops-mcp-server.git
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

This MCP server provides 7 powerful tools for exploring the Superops.ai GraphQL API:

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
Get Superops.ai API endpoints and connection information.

**Usage:** `get_superops_api_endpoints()`

## 🎯 Common Workflows

### Exploring Ticket Management
```javascript
// 1. Start by loading documentation
fetch_superops_documentation()

// 2. Find ticket-related operations
search_superops_docs({ query: "ticket" })

// 3. Get details about the Ticket type
get_superops_type_info({ typeName: "Ticket" })

// 4. Learn how to fetch tickets
get_superops_query_info({ queryName: "getTicketList" })

// 5. Learn how to create tickets
get_superops_mutation_info({ mutationName: "createTicket" })
```

### Understanding Asset Management
```javascript
// Find all asset operations
search_superops_docs({ query: "asset", type: "all" })

// Understand asset structure
get_superops_type_info({ typeName: "Asset" })

// Learn asset querying
get_superops_query_info({ queryName: "getAssetList" })
```

## 📊 API Coverage

This MCP server provides access to:

- **80+ GraphQL Queries** - Fetch tickets, assets, clients, invoices, and more
- **30+ GraphQL Mutations** - Create, update, and manage MSP resources  
- **100+ GraphQL Types** - Complete type system with field descriptions
- **US & EU Endpoints** - Support for both data centers

### Key Operation Categories

- **Tickets** - Complete ticket lifecycle management
- **Assets** - IT asset tracking and monitoring
- **Clients** - Customer and site management
- **Invoicing** - Billing and financial operations
- **Tasks** - Work and project management
- **Alerts** - System monitoring and notifications
- **Work Logs** - Time tracking and billing
- **Service Catalog** - Products and services management

## 🌐 Superops.ai API Information

### API Endpoints
- **US Data Center**: `https://api.superops.ai/msp`
- **EU Data Center**: `https://euapi.superops.ai/msp`

### Documentation Resources
- **Official API Docs**: https://developer.superops.com/msp
- **API Guide**: https://support.superops.com/en/collections/3666305-api-documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/superops-mcp-server/issues)
- **Superops.ai Support**: [Official Support](https://support.superops.com)
- **MCP Documentation**: [Model Context Protocol](https://modelcontextprotocol.io)

## 🔗 Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [GitMCP Runtime](https://gitmcp.io)
- [Superops.ai](https://superops.ai)

---

**Made with ❤️ for the MSP community**