// examples/usage.ts
// Example usage and test cases for the Superops MCP server

/**
 * Example interactions with the Superops.ai MCP server
 * These examples show how to use each tool effectively
 */

// 1. FETCH DOCUMENTATION
// This is usually the first step - loads all the API documentation
console.log("=== FETCHING DOCUMENTATION ===");
/*
Tool: fetch_superops_documentation
Input: {}
Expected Output: Summary of loaded queries, mutations, and types
*/

// 2. SEARCH FOR TICKET OPERATIONS
console.log("=== SEARCHING FOR TICKET OPERATIONS ===");
/*
Tool: search_superops_docs
Input: {
  "query": "ticket",
  "type": "queries"
}
Expected Output: All ticket-related queries like getTicket, getTicketList, etc.
*/

// 3. GET SPECIFIC QUERY INFORMATION
console.log("=== GET TICKET QUERY DETAILS ===");
/*
Tool: get_superops_query_info
Input: {
  "queryName": "getTicket"
}
Expected Output: Complete details including arguments, return type, and example
*/

// 4. SEARCH FOR ASSET OPERATIONS
console.log("=== SEARCHING FOR ASSET OPERATIONS ===");
/*
Tool: search_superops_docs
Input: {
  "query": "asset"
}
Expected Output: All asset-related queries and mutations
*/

// 5. GET MUTATION INFORMATION
console.log("=== GET CREATE TICKET MUTATION ===");
/*
Tool: get_superops_mutation_info
Input: {
  "mutationName": "createTicket"
}
Expected Output: Details about creating tickets including required fields
*/

// 6. EXPLORE TYPE DEFINITIONS
console.log("=== GET TICKET TYPE DEFINITION ===");
/*
Tool: get_superops_type_info
Input: {
  "typeName": "Ticket"
}
Expected Output: All fields in the Ticket type with descriptions
*/

// 7. LIST ALL OPERATIONS BY CATEGORY
console.log("=== LIST ALL QUERIES ===");
/*
Tool: list_superops_operations
Input: {
  "operationType": "queries"
}
Expected Output: Organized list of all available queries
*/

// 8. GET API ENDPOINTS
console.log("=== GET API ENDPOINTS ===");
/*
Tool: get_superops_api_endpoints
Input: {}
Expected Output: US and EU endpoint URLs with setup instructions
*/

// COMMON SEARCH PATTERNS
const commonSearches = [
  // Core entities
  { query: "ticket", description: "Find all ticket-related operations" },
  { query: "asset", description: "Find all asset management operations" },
  { query: "client", description: "Find all client management operations" },
  { query: "invoice", description: "Find all invoicing operations" },
  
  // Specific operations
  { query: "create", description: "Find all creation operations" },
  { query: "update", description: "Find all update operations" },
  { query: "list", description: "Find all list/fetch operations" },
  { query: "delete", description: "Find all deletion operations" },
  
  // Features
  { query: "alert", description: "Find all alert-related operations" },
  { query: "worklog", description: "Find all work logging operations" },
  { query: "script", description: "Find all script-related operations" },
  { query: "custom field", description: "Find custom field operations" },
];

// POPULAR QUERIES TO EXPLORE
const popularQueries = [
  "getTicket",
  "getTicketList", 
  "getAsset",
  "getAssetList",
  "getClient",
  "getClientList",
  "getInvoice",
  "getInvoiceList",
  "getAlertList",
  "getTaskList",
];

// POPULAR MUTATIONS TO EXPLORE  
const popularMutations = [
  "createTicket",
  "updateTicket",
  "createAsset",
  "updateAsset", 
  "createClient",
  "updateClient",
  "createTask",
  "createAlert",
];

// IMPORTANT TYPES TO UNDERSTAND
const importantTypes = [
  "Ticket",
  "Asset", 
  "Client",
  "Invoice",
  "Task",
  "Alert",
  "WorklogEntry",
  "ServiceCatalogItem",
];

// WORKFLOW EXAMPLES

/**
 * WORKFLOW 1: Understanding Ticket Management
 */
console.log("=== TICKET MANAGEMENT WORKFLOW ===");
/*
1. Search for ticket operations:
   search_superops_docs({ query: "ticket" })

2. Get ticket type definition:
   get_superops_type_info({ typeName: "Ticket" })

3. Learn how to fetch tickets:
   get_superops_query_info({ queryName: "getTicketList" })

4. Learn how to create tickets:
   get_superops_mutation_info({ mutationName: "createTicket" })

5. Learn how to update tickets:
   get_superops_mutation_info({ mutationName: "updateTicket" })
*/

/**
 * WORKFLOW 2: Asset Management Setup
 */
console.log("=== ASSET MANAGEMENT WORKFLOW ===");
/*
1. Explore asset operations:
   search_superops_docs({ query: "asset", type: "all" })

2. Understand asset structure:
   get_superops_type_info({ typeName: "Asset" })

3. Learn to fetch asset details:
   get_superops_query_info({ queryName: "getAsset" })

4. Learn asset listing with pagination:
   get_superops_query_info({ queryName: "getAssetList" })

5. Understand asset updates:
   get_superops_mutation_info({ mutationName: "updateAsset" })
*/

/**
 * WORKFLOW 3: Client Onboarding
 */
console.log("=== CLIENT ONBOARDING WORKFLOW ===");
/*
1. Find client-related operations:
   search_superops_docs({ query: "client" })

2. Understand client data structure:
   get_superops_type_info({ typeName: "Client" })

3. Learn client creation process:
   get_superops_mutation_info({ mutationName: "createClientV2" })

4. Learn about client sites:
   get_superops_mutation_info({ mutationName: "createClientSite" })

5. Learn about client users:
   get_superops_mutation_info({ mutationName: "createClientUser" })
*/

/**
 * ERROR HANDLING EXAMPLES
 */
console.log("=== ERROR HANDLING ===");

// Invalid query name - will suggest alternatives
/*
Tool: get_superops_query_info
Input: { "queryName": "getTickets" }  // Note: should be "getTicketList"
Expected: Error with suggestions like "getTicketList", "getTicket"
*/

// Invalid type name - will suggest alternatives  
/*
Tool: get_superops_type_info
Input: { "typeName": "Tickets" }  // Note: should be "Ticket"
Expected: Error with suggestions like "Ticket", "TicketList"
*/

// No search results
/*
Tool: search_superops_docs
Input: { "query": "nonexistent" }
Expected: Empty results with search tips
*/

/**
 * ADVANCED USAGE PATTERNS
 */

// Finding operations by return type
/*
To find all operations that return a specific type:
1. search_superops_docs({ query: "TicketList" })
2. This will find operations returning TicketList type
*/

// Finding input requirements
/*
To understand what data you need to provide:
1. get_superops_mutation_info({ mutationName: "createTicket" })
2. Look at the arguments section for required fields
3. get_superops_type_info({ typeName: "CreateTicketInput" })
*/

// Building GraphQL queries
/*
After exploring with MCP tools, you can build actual GraphQL queries:

Example based on getTicket query info:
```graphql
query getTicket($input: TicketIdentifierInput!) {
  getTicket(input: $input) {
    ticketId
    displayId
    subject
    status
    priority
    client {
      accountId
      name
    }
    site {
      id
      name
    }
  }
}
```

Variables:
```json
{
  "input": {
    "ticketId": "7928838372746166987"
  }
}
```
*/

export {
  commonSearches,
  popularQueries,
  popularMutations,
  importantTypes,
};