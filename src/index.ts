#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import { SuperopsDocumentationParser, GraphQLOperation, GraphQLType } from './parser.js';

class SuperopsDocumentationMCP {
  private server: Server;
  private documentation: any = null;
  private queries: Map<string, GraphQLOperation> = new Map();
  private mutations: Map<string, GraphQLOperation> = new Map();
  private types: Map<string, GraphQLType> = new Map();
  private endpoints: { [key: string]: string } = {};
  private parser: SuperopsDocumentationParser | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'superops-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'fetch_superops_documentation',
            description: 'Fetch the complete Superops.ai GraphQL API documentation',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'search_superops_docs',
            description: 'Search within the Superops.ai documentation for specific operations, types, or concepts',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find relevant documentation',
                },
                type: {
                  type: 'string',
                  enum: ['all', 'queries', 'mutations', 'types'],
                  description: 'Type of documentation to search (default: all)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_superops_query_info',
            description: 'Get detailed information about a specific GraphQL query',
            inputSchema: {
              type: 'object',
              properties: {
                queryName: {
                  type: 'string',
                  description: 'Name of the GraphQL query (e.g., getTicket, getAssetList)',
                },
              },
              required: ['queryName'],
            },
          },
          {
            name: 'get_superops_mutation_info',
            description: 'Get detailed information about a specific GraphQL mutation',
            inputSchema: {
              type: 'object',
              properties: {
                mutationName: {
                  type: 'string',
                  description: 'Name of the GraphQL mutation (e.g., createTicket, updateAsset)',
                },
              },
              required: ['mutationName'],
            },
          },
          {
            name: 'get_superops_type_info',
            description: 'Get detailed information about a specific GraphQL type',
            inputSchema: {
              type: 'object',
              properties: {
                typeName: {
                  type: 'string',
                  description: 'Name of the GraphQL type (e.g., Ticket, Asset, Client)',
                },
              },
              required: ['typeName'],
            },
          },
          {
            name: 'list_superops_operations',
            description: 'List all available GraphQL queries and mutations',
            inputSchema: {
              type: 'object',
              properties: {
                operationType: {
                  type: 'string',
                  enum: ['queries', 'mutations', 'all'],
                  description: 'Type of operations to list (default: all)',
                },
              },
            },
          },
          {
            name: 'get_superops_api_endpoints',
            description: 'Get Superops.ai API endpoints and connection information',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'generate_superops_request',
            description: 'Generate a complete GraphQL request with proper headers and authentication for Superops.ai',
            inputSchema: {
              type: 'object',
              properties: {
                operationName: {
                  type: 'string',
                  description: 'Name of the GraphQL operation (query or mutation)',
                },
                subdomain: {
                  type: 'string', 
                  description: 'Your Superops.ai subdomain (e.g., "ingramtechnology", "yourcompany")',
                },
                apiToken: {
                  type: 'string',
                  description: 'Your Superops.ai API token (format: api-XXXXXXXXX)',
                },
                variables: {
                  type: 'object',
                  description: 'Variables for the GraphQL operation (optional)',
                },
                endpoint: {
                  type: 'string',
                  enum: ['us', 'eu'],
                  description: 'Which endpoint to use (default: us)',
                },
              },
              required: ['operationName', 'subdomain', 'apiToken'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'fetch_superops_documentation':
            return await this.fetchDocumentation();

          case 'search_superops_docs':
            return await this.searchDocumentation(
              request.params.arguments?.query as string,
              request.params.arguments?.type as string
            );

          case 'get_superops_query_info':
            return await this.getQueryInfo(request.params.arguments?.queryName as string);

          case 'get_superops_mutation_info':
            return await this.getMutationInfo(request.params.arguments?.mutationName as string);

          case 'get_superops_type_info':
            return await this.getTypeInfo(request.params.arguments?.typeName as string);

          case 'list_superops_operations':
            return await this.listOperations(request.params.arguments?.operationType as string);

          case 'get_superops_api_endpoints':
            return await this.getApiEndpoints();

          case 'generate_superops_request':
            return await this.generateRequest(
              request.params.arguments?.operationName as string,
              request.params.arguments?.subdomain as string,
              request.params.arguments?.apiToken as string,
              request.params.arguments?.variables as object,
              request.params.arguments?.endpoint as string
            );

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async fetchDocumentation() {
    try {
      const response = await fetch('https://developer.superops.com/msp');
      const html = await response.text();
      
      this.parser = new SuperopsDocumentationParser(html);
      const parsed = this.parser.parseAll();
      
      // Store parsed data
      this.endpoints = parsed.endpoints;
      
      // Convert to Maps for easy lookup
      this.queries.clear();
      this.mutations.clear();
      this.types.clear();
      
      Object.entries(parsed.queries).forEach(([name, query]) => {
        this.queries.set(name, query);
      });
      
      Object.entries(parsed.mutations).forEach(([name, mutation]) => {
        this.mutations.set(name, mutation);
      });
      
      Object.entries(parsed.types).forEach(([name, type]) => {
        this.types.set(name, type);
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully fetched and parsed Superops.ai GraphQL API documentation!\n\n` +
                  `📊 **Summary:**\n` +
                  `- **${this.queries.size}** queries\n` +
                  `- **${this.mutations.size}** mutations\n` +
                  `- **${this.types.size}** types\n` +
                  `- **${Object.keys(this.endpoints).length}** API endpoints\n\n` +
                  `🔧 **Available Tools:**\n` +
                  `- Use \`search_superops_docs\` to search the documentation\n` +
                  `- Use \`get_superops_query_info\` for specific query details\n` +
                  `- Use \`get_superops_mutation_info\` for mutation details\n` +
                  `- Use \`get_superops_type_info\` for type information\n` +
                  `- Use \`list_superops_operations\` to see all operations\n\n` +
                  `🌐 **API Endpoints:**\n` +
                  Object.entries(this.endpoints).map(([region, url]) => `- **${region.toUpperCase()}**: ${url}`).join('\n'),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async parseDocumentation($: cheerio.CheerioAPI) {
    // Parse API endpoints
    const apiEndpoints = {
      us: 'https://api.superops.ai/msp',
      eu: 'https://euapi.superops.ai/msp'
    };

    // Parse queries
    const queryElements = $('h2:contains("Queries")').nextUntil('h2');
    this.parseOperations($, queryElements, 'query');

    // Parse mutations
    const mutationElements = $('h2:contains("Mutations")').nextUntil('h2');
    this.parseOperations($, mutationElements, 'mutation');

    // Parse types
    const typeElements = $('h2:contains("Types")').nextUntil();
    this.parseTypes($, typeElements);
  }

  private parseOperations($: cheerio.CheerioAPI, elements: cheerio.Cheerio, type: 'query' | 'mutation') {
    const operations = type === 'query' ? this.queries : this.mutations;
    
    elements.each((_, element) => {
      const $element = $(element);
      
      if ($element.is('h3')) {
        const operationName = $element.text().trim();
        const operation: GraphQLOperation = {
          name: operationName,
          type: type,
        };

        // Get description
        const descriptionElement = $element.next('p');
        if (descriptionElement.length) {
          operation.description = descriptionElement.text().trim();
        }

        // Parse arguments table
        const argsTable = $element.nextAll('table').first();
        if (argsTable.length) {
          operation.arguments = [];
          argsTable.find('tbody tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              const nameType = $(cells[0]).text().trim();
              const description = $(cells[1]).text().trim();
              
              const match = nameType.match(/^(\w+)\s*-\s*(.+)$/);
              if (match) {
                const [, name, typeInfo] = match;
                operation.arguments!.push({
                  name,
                  type: typeInfo,
                  description,
                  required: typeInfo.includes('!'),
                });
              }
            }
          });
        }

        // Parse example
        const exampleSection = $element.nextAll().filter((_, el) => $(el).text().includes('Example'));
        if (exampleSection.length) {
          const queryCode = exampleSection.nextAll('pre, code').first().text();
          const variablesCode = exampleSection.nextAll().filter((_, el) => $(el).text().includes('Variables')).next('pre, code').text();
          const responseCode = exampleSection.nextAll().filter((_, el) => $(el).text().includes('Response')).next('pre, code').text();
          
          operation.example = {
            query: queryCode,
            variables: variablesCode ? this.parseJSON(variablesCode) : undefined,
            response: responseCode ? this.parseJSON(responseCode) : undefined,
          };
        }

        operations.set(operationName, operation);
      }
    });
  }

  private parseTypes($: cheerio.CheerioAPI, elements: cheerio.Cheerio) {
    elements.each((_, element) => {
      const $element = $(element);
      
      if ($element.is('h3')) {
        const typeName = $element.text().trim();
        const type: GraphQLType = {
          name: typeName,
        };

        // Get description
        const descriptionElement = $element.next('p');
        if (descriptionElement.length) {
          type.description = descriptionElement.text().trim();
        }

        // Parse fields table
        const fieldsTable = $element.nextAll('table').first();
        if (fieldsTable.length) {
          type.fields = [];
          fieldsTable.find('tbody tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              const nameType = $(cells[0]).text().trim();
              const description = $(cells[1]).text().trim();
              
              const match = nameType.match(/^(\w+)\s*-\s*(.+)$/);
              if (match) {
                const [, name, fieldType] = match;
                type.fields!.push({
                  name,
                  type: fieldType,
                  description,
                  required: fieldType.includes('!'),
                });
              }
            }
          });
        }

        this.types.set(typeName, type);
      }
    });
  }

  private parseJSON(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async searchDocumentation(query: string, type: string = 'all') {
    if (!this.parser && (this.queries.size === 0 || this.mutations.size === 0)) {
      await this.fetchDocumentation();
    }

    if (!this.parser) {
      throw new Error('Documentation not loaded');
    }

    const results: any[] = [];

    if (type === 'all' || type === 'queries') {
      const queryResults = this.parser.searchOperations(query, Object.fromEntries(this.queries));
      results.push(...queryResults.map(q => ({ category: 'query', ...q })));
    }

    if (type === 'all' || type === 'mutations') {
      const mutationResults = this.parser.searchOperations(query, Object.fromEntries(this.mutations));
      results.push(...mutationResults.map(m => ({ category: 'mutation', ...m })));
    }

    if (type === 'all' || type === 'types') {
      const typeResults = this.parser.searchTypes(query, Object.fromEntries(this.types));
      results.push(...typeResults.map(t => ({ category: 'type', ...t })));
    }

    const formattedResults = results.map(result => {
      const { category, ...rest } = result;
      return {
        category,
        name: rest.name,
        description: rest.description || 'No description available',
        ...(category === 'query' || category === 'mutation' ? {
          returnType: rest.returnType,
          argumentCount: rest.arguments?.length || 0,
          hasExample: !!rest.example,
        } : {}),
        ...(category === 'type' ? {
          kind: rest.kind,
          fieldCount: rest.fields?.length || 0,
          enumValueCount: rest.enumValues?.length || 0,
        } : {}),
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: `🔍 **Search Results for "${query}"** (${results.length} results)\n\n` +
                (results.length === 0 
                  ? `No results found. Try searching for:\n- Operation names (e.g. "getTicket", "createAsset")\n- Types (e.g. "Ticket", "Asset")\n- Keywords (e.g. "ticket", "asset", "client")`
                  : formattedResults.map(result => 
                      `**${result.category.toUpperCase()}: ${result.name}**\n` +
                      `${result.description}\n` +
                      (result.category !== 'type' 
                        ? `- Returns: ${result.returnType || 'Unknown'}\n- Arguments: ${result.argumentCount}\n- Has Example: ${result.hasExample ? '✅' : '❌'}`
                        : `- Kind: ${result.kind}\n- Fields: ${result.fieldCount}\n- Enum Values: ${result.enumValueCount || 'N/A'}`
                      )
                    ).join('\n\n')
                ),
        },
      ],
    };
  }

  private async getQueryInfo(queryName: string) {
    if (!this.queries.has(queryName)) {
      await this.fetchDocumentation();
    }

    const query = this.queries.get(queryName);
    if (!query) {
      // Suggest similar queries
      const suggestions = Array.from(this.queries.keys())
        .filter(name => name.toLowerCase().includes(queryName.toLowerCase()))
        .slice(0, 5);
      
      throw new Error(`Query "${queryName}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(', ')}?` : 'Use list_superops_operations to see all available queries.'}`);
    }

    const formattedQuery = this.formatOperationInfo(query);

    return {
      content: [
        {
          type: 'text',
          text: formattedQuery,
        },
      ],
    };
  }

  private async getMutationInfo(mutationName: string) {
    if (!this.mutations.has(mutationName)) {
      await this.fetchDocumentation();
    }

    const mutation = this.mutations.get(mutationName);
    if (!mutation) {
      // Suggest similar mutations
      const suggestions = Array.from(this.mutations.keys())
        .filter(name => name.toLowerCase().includes(mutationName.toLowerCase()))
        .slice(0, 5);
      
      throw new Error(`Mutation "${mutationName}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(', ')}?` : 'Use list_superops_operations to see all available mutations.'}`);
    }

    const formattedMutation = this.formatOperationInfo(mutation);

    return {
      content: [
        {
          type: 'text',
          text: formattedMutation,
        },
      ],
    };
  }

  private formatOperationInfo(operation: GraphQLOperation): string {
    let content = `# ${operation.type.toUpperCase()}: ${operation.name}\n\n`;
    
    if (operation.description) {
      content += `**Description:** ${operation.description}\n\n`;
    }
    
    if (operation.returnType) {
      content += `**Returns:** \`${operation.returnType}\`\n\n`;
    }
    
    if (operation.arguments && operation.arguments.length > 0) {
      content += `## Arguments\n\n`;
      operation.arguments.forEach(arg => {
        content += `- **${arg.name}** (\`${arg.type}\`)${arg.required ? ' - **Required**' : ''}\n`;
        if (arg.description) {
          content += `  - ${arg.description}\n`;
        }
      });
      content += '\n';
    }
    
    if (operation.example) {
      content += `## Example Usage\n\n`;
      
      if (operation.example.query) {
        content += `**GraphQL Query:**\n\`\`\`graphql\n${operation.example.query}\n\`\`\`\n\n`;
      }
      
      if (operation.example.variables) {
        content += `**Variables:**\n\`\`\`json\n${JSON.stringify(operation.example.variables, null, 2)}\n\`\`\`\n\n`;
      }
      
      if (operation.example.response) {
        content += `**Response:**\n\`\`\`json\n${JSON.stringify(operation.example.response, null, 2)}\n\`\`\`\n`;
      }
    }
    
    return content;
  }}" not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Mutation: ${mutation.name}\n\n${JSON.stringify(mutation, null, 2)}`,
        },
      ],
    };
  }

  private async getTypeInfo(typeName: string) {
    if (!this.types.has(typeName)) {
      await this.fetchDocumentation();
    }

    const type = this.types.get(typeName);
    if (!type) {
      // Suggest similar types
      const suggestions = Array.from(this.types.keys())
        .filter(name => name.toLowerCase().includes(typeName.toLowerCase()))
        .slice(0, 5);
      
      throw new Error(`Type "${typeName}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(', ')}?` : 'Use search_superops_docs to find available types.'}`);
    }

    const formattedType = this.formatTypeInfo(type);

    return {
      content: [
        {
          type: 'text',
          text: formattedType,
        },
      ],
    };
  }

  private formatTypeInfo(type: GraphQLType): string {
    let content = `# TYPE: ${type.name}\n\n`;
    
    content += `**Kind:** ${type.kind}\n\n`;
    
    if (type.description) {
      content += `**Description:** ${type.description}\n\n`;
    }
    
    if (type.fields && type.fields.length > 0) {
      content += `## Fields\n\n`;
      type.fields.forEach(field => {
        content += `- **${field.name}** (\`${field.type}\`)${field.required ? ' - **Required**' : ''}\n`;
        if (field.description) {
          content += `  - ${field.description}\n`;
        }
      });
      content += '\n';
    }
    
    if (type.enumValues && type.enumValues.length > 0) {
      content += `## Enum Values\n\n`;
      type.enumValues.forEach(enumValue => {
        content += `- **${enumValue.name}**\n`;
        if (enumValue.description) {
          content += `  - ${enumValue.description}\n`;
        }
      });
      content += '\n';
    }
    
    return content;
  }

  private async listOperations(operationType: string = 'all') {
    if (this.queries.size === 0 || this.mutations.size === 0) {
      await this.fetchDocumentation();
    }

    let content = '';

    if (operationType === 'all' || operationType === 'queries') {
      content += `# 🔍 Queries (${this.queries.size})\n\n`;
      
      // Group queries by category for better organization
      const queryCategories = this.groupOperationsByCategory(Array.from(this.queries.values()));
      
      Object.entries(queryCategories).forEach(([category, operations]) => {
        content += `## ${category}\n\n`;
        operations.forEach(query => {
          content += `- **${query.name}**: ${query.description || 'No description'}\n`;
          if (query.returnType) {
            content += `  - Returns: \`${query.returnType}\`\n`;
          }
        });
        content += '\n';
      });
    }

    if (operationType === 'all' || operationType === 'mutations') {
      content += `# ✏️ Mutations (${this.mutations.size})\n\n`;
      
      // Group mutations by category
      const mutationCategories = this.groupOperationsByCategory(Array.from(this.mutations.values()));
      
      Object.entries(mutationCategories).forEach(([category, operations]) => {
        content += `## ${category}\n\n`;
        operations.forEach(mutation => {
          content += `- **${mutation.name}**: ${mutation.description || 'No description'}\n`;
          if (mutation.returnType) {
            content += `  - Returns: \`${mutation.returnType}\`\n`;
          }
        });
        content += '\n';
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private groupOperationsByCategory(operations: GraphQLOperation[]): { [category: string]: GraphQLOperation[] } {
    const categories: { [category: string]: GraphQLOperation[] } = {};
    
    operations.forEach(operation => {
      let category = 'Other';
      
      // Categorize based on operation name patterns
      const name = operation.name.toLowerCase();
      
      if (name.includes('ticket')) {
        category = 'Tickets';
      } else if (name.includes('asset')) {
        category = 'Assets';
      } else if (name.includes('client')) {
        category = 'Clients';
      } else if (name.includes('invoice')) {
        category = 'Invoicing';
      } else if (name.includes('task')) {
        category = 'Tasks';
      } else if (name.includes('alert')) {
        category = 'Alerts';
      } else if (name.includes('worklog')) {
        category = 'Work Logs';
      } else if (name.includes('service')) {
        category = 'Services';
      } else if (name.includes('script')) {
        category = 'Scripts';
      } else if (name.includes('category') || name.includes('priority') || name.includes('status')) {
        category = 'Configuration';
      }
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(operation);
    });
    
    // Sort categories and operations within each category
    const sortedCategories: { [category: string]: GraphQLOperation[] } = {};
    const categoryOrder = ['Tickets', 'Assets', 'Clients', 'Tasks', 'Alerts', 'Invoicing', 'Services', 'Work Logs', 'Scripts', 'Configuration', 'Other'];
    
    categoryOrder.forEach(category => {
      if (categories[category]) {
        sortedCategories[category] = categories[category].sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    
    // Add any remaining categories
    Object.keys(categories).forEach(category => {
      if (!sortedCategories[category]) {
        sortedCategories[category] = categories[category].sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    
    return sortedCategories;
  }

  private async generateRequest(operationName: string, subdomain: string, variables?: object, endpoint: string = 'us') {
    if (!this.queries.has(operationName) && !this.mutations.has(operationName)) {
      await this.fetchDocumentation();
    }

    const operation = this.queries.get(operationName) || this.mutations.get(operationName);
    if (!operation) {
      // Suggest similar operations
      const allOps = [...this.queries.keys(), ...this.mutations.keys()];
      const suggestions = allOps
        .filter(name => name.toLowerCase().includes(operationName.toLowerCase()))
        .slice(0, 5);
      
      throw new Error(`Operation "${operationName}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(', ')}?` : 'Use list_superops_operations to see all available operations.'}`);
    }

    const apiUrl = endpoint === 'eu' ? 'https://euapi.superops.ai/msp' : 'https://api.superops.ai/msp';
    
    // Use the example query from the operation, or generate a basic one
    let query = operation.example?.query || '';
    
    if (!query) {
      // Generate a basic query structure if no example exists
      const operationType = operation.type;
      const returnType = operation.returnType || 'String';
      
      if (operation.arguments && operation.arguments.length > 0) {
        const requiredArgs = operation.arguments
          .filter(arg => arg.required)
          .map(arg => `${arg.name}: ${arg.type}`)
          .join(', ');
        
        const argList = operation.arguments
          .filter(arg => arg.required)
          .map(arg => `${arg.name}: ${arg.name}`)
          .join(', ');
        
        query = `${operationType} ${operationName}(${requiredArgs}) {
  ${operationName}(${argList}) {
    # Add the fields you want to retrieve here
    # Use get_superops_type_info to see available fields
  }
}`;
      } else {
        query = `${operationType} {
  ${operationName} {
    # Add the fields you want to retrieve here  
    # Use get_superops_type_info to see available fields
  }
}`;
      }
    }

    // Prepare variables
    const requestVariables = variables || operation.example?.variables || {};

    // Generate curl command
    const curlCommand = `curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -H "CustomerSubDomain: ${subdomain}" \\
  -d '${JSON.stringify({
    query: query.replace(/\n/g, '\\n').replace(/"/g, '\\"'),
    variables: requestVariables
  }, null, 0)}'`;

    // Generate JavaScript fetch example
    const fetchExample = `const response = await fetch('${apiUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CustomerSubDomain': '${subdomain}'
  },
  body: JSON.stringify({
    query: \`${query}\`,
    variables: ${JSON.stringify(requestVariables, null, 2)}
  })
});

const data = await response.json();
console.log(data);`;

    // Generate Python requests example  
    const pythonExample = `import requests
import json

url = '${apiUrl}'
headers = {
    'Content-Type': 'application/json',
    'CustomerSubDomain': '${subdomain}'
}

query = """${query}"""

variables = ${JSON.stringify(requestVariables, null, 2)}

response = requests.post(
    url, 
    headers=headers,
    json={'query': query, 'variables': variables}
)

data = response.json()
print(json.dumps(data, indent=2))`;

    return {
      content: [
        {
          type: 'text',
          text: `# 🚀 GraphQL Request for ${operationName}

## Operation Details
- **Type**: ${operation.type}
- **Name**: ${operationName}
- **Endpoint**: ${apiUrl}
- **Subdomain**: ${subdomain}

## GraphQL Query
\`\`\`graphql
${query}
\`\`\`

## Variables
\`\`\`json
${JSON.stringify(requestVariables, null, 2)}
\`\`\`

## cURL Command
\`\`\`bash
${curlCommand}
\`\`\`

## JavaScript (fetch)
\`\`\`javascript
${fetchExample}
\`\`\`

## Python (requests)
\`\`\`python
${pythonExample}
\`\`\`

## Required Headers
- **CustomerSubDomain**: \`${subdomain}\` (Your Superops.ai subdomain)
- **Content-Type**: \`application/json\`

## Notes
- Replace \`${subdomain}\` with your actual Superops.ai subdomain
- The subdomain is the part before \`.superops.ai\` in your Superops URL
- Example: If your URL is \`https://ingramtechnology.superops.ai\`, use \`ingramtechnology\`
- All requests must use HTTPS

${operation.arguments && operation.arguments.length > 0 ? `## Required Arguments
${operation.arguments
  .filter(arg => arg.required)
  .map(arg => `- **${arg.name}** (\`${arg.type}\`): ${arg.description || 'No description'}`)
  .join('\n')}` : ''}`,
        },
      ],
    };
  }

  private async getApiEndpoints() {
    return {
      content: [
        {
          type: 'text',
          text: `# 🌐 Superops.ai GraphQL API Endpoints

## Production Endpoints

### US Data Center
- **URL**: https://api.superops.ai/msp
- **Region**: United States (Primary)

### EU Data Center  
- **URL**: https://euapi.superops.ai/msp
- **Region**: Europe

## Required Headers (ALL Required)

### 1. Authorization Header
\`\`\`
Authorization: Bearer api-XXXXXXXXX
\`\`\`
Get your API token from Superops.ai Settings → API Keys

### 2. Customer Subdomain Header
\`\`\`
CustomerSubDomain: YOUR_SUBDOMAIN
\`\`\`
Your organization's subdomain (e.g., "ingramtechnology", "yourcompany")

### 3. Content Type Header
\`\`\`
Content-Type: application/json
\`\`\`

## Complete Example Request

\`\`\`bash
curl -X POST https://api.superops.ai/msp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer api-your-token-here" \\
  -H "CustomerSubDomain: yourcompany" \\
  -d '{
    "query": "query getTicketList($input: ListInfoInput!) { getTicketList(input: $input) { tickets { ticketId displayId subject status } listInfo { totalCount } } }",
    "variables": {
      "input": {
        "page": 1,
        "pageSize": 10
      }
    }
  }'
\`\`\`

## Authentication Requirements

Superops.ai requires **BOTH** authentication headers:

1. **Bearer Token** - Your API key from Superops.ai settings
   - Format: \`api-XXXXXXXXX\`
   - Get from: Superops.ai → Settings → API Keys

2. **Customer Subdomain** - Your organization identifier
   - Format: Just the subdomain part (no .superops.ai)
   - Example: If your URL is \`https://acmecompany.superops.ai\`
   - Then use: \`acmecompany\`

## How to Get Your Credentials

### API Token
1. Log into your Superops.ai account
2. Go to **Settings** → **API Keys**
3. Generate or copy your API token
4. Format will be: \`api-XXXXXXXXX\`

### Subdomain
1. Look at your Superops.ai URL
2. Example: \`https://yourcompany.superops.ai\`
3. Your subdomain is: \`yourcompany\`

## Testing Your Connection

\`\`\`bash
# Test with your actual credentials
curl -X POST https://api.superops.ai/msp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer api-your-actual-token" \\
  -H "CustomerSubDomain: your-actual-subdomain" \\
  -d '{"query": "{ __schema { types { name } } }"}'
\`\`\`

## Using the generate_superops_request Tool

Use the \`generate_superops_request\` tool to create complete, ready-to-use requests:

\`\`\`javascript
generate_superops_request({
  operationName: "getTicketList",
  subdomain: "yourcompany",
  apiToken: "api-your-token-here",
  variables: { "input": { "page": 1, "pageSize": 10 } }
})
\`\`\`

## Additional Resources
- **API Guide**: https://support.superops.com/en/collections/3666305-api-documentation
- **Official Documentation**: https://developer.superops.com/msp

## Available Operations
- **${this.queries.size}** queries for fetching data
- **${this.mutations.size}** mutations for modifying data  
- **${this.types.size}** types defining the schema

Use the MCP tools to explore specific operations and types!`,
        },
      ],
    };
  }

  // Remove the old parsing methods since we're using the enhanced parser
  private async parseDocumentation($: cheerio.CheerioAPI) {
    // This method is no longer needed - replaced by SuperopsDocumentationParser
  }

  private parseOperations($: cheerio.CheerioAPI, elements: cheerio.Cheerio, type: 'query' | 'mutation') {
    // This method is no longer needed - replaced by SuperopsDocumentationParser
  }

  private parseTypes($: cheerio.CheerioAPI, elements: cheerio.Cheerio) {
    // This method is no longer needed - replaced by SuperopsDocumentationParser
  }

  private parseJSON(text: string): any {
    // This method is no longer needed - replaced by SuperopsDocumentationParser
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Superops.ai MCP server running on stdio');
  }
}

const server = new SuperopsDocumentationMCP();
server.run().catch(console.error);