#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

interface GraphQLOperation {
  name: string;
  type: 'query' | 'mutation';
  description?: string;
  arguments?: Array<{
    name: string;
    type: string;
    description?: string;
    required?: boolean;
  }>;
  returnType?: string;
  example?: {
    query: string;
    variables?: any;
    response?: any;
  };
}

interface GraphQLType {
  name: string;
  description?: string;
  fields?: Array<{
    name: string;
    type: string;
    description?: string;
    required?: boolean;
  }>;
  inputType?: boolean;
  enumValues?: Array<{
    name: string;
    description?: string;
  }>;
}

class SuperopsDocumentationMCP {
  private server: Server;
  private documentation: any = null;
  private queries: Map<string, GraphQLOperation> = new Map();
  private mutations: Map<string, GraphQLOperation> = new Map();
  private types: Map<string, GraphQLType> = new Map();

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
      const $ = cheerio.load(html);

      await this.parseDocumentation($);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully fetched Superops.ai GraphQL API documentation!\n\n` +
                  `Found:\n` +
                  `- ${this.queries.size} queries\n` +
                  `- ${this.mutations.size} mutations\n` +
                  `- ${this.types.size} types\n\n` +
                  `Use other MCP tools to explore the documentation in detail.`,
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
    if (!this.documentation && (this.queries.size === 0 || this.mutations.size === 0)) {
      await this.fetchDocumentation();
    }

    const searchLower = query.toLowerCase();
    const results: any[] = [];

    const searchInOperation = (op: GraphQLOperation) => {
      return (
        op.name.toLowerCase().includes(searchLower) ||
        (op.description && op.description.toLowerCase().includes(searchLower)) ||
        (op.arguments && op.arguments.some(arg => 
          arg.name.toLowerCase().includes(searchLower) ||
          arg.type.toLowerCase().includes(searchLower) ||
          (arg.description && arg.description.toLowerCase().includes(searchLower))
        ))
      );
    };

    const searchInType = (t: GraphQLType) => {
      return (
        t.name.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower)) ||
        (t.fields && t.fields.some(field => 
          field.name.toLowerCase().includes(searchLower) ||
          field.type.toLowerCase().includes(searchLower) ||
          (field.description && field.description.toLowerCase().includes(searchLower))
        ))
      );
    };

    if (type === 'all' || type === 'queries') {
      for (const [name, operation] of this.queries) {
        if (searchInOperation(operation)) {
          results.push({ type: 'query', ...operation });
        }
      }
    }

    if (type === 'all' || type === 'mutations') {
      for (const [name, operation] of this.mutations) {
        if (searchInOperation(operation)) {
          results.push({ type: 'mutation', ...operation });
        }
      }
    }

    if (type === 'all' || type === 'types') {
      for (const [name, typeInfo] of this.types) {
        if (searchInType(typeInfo)) {
          results.push({ type: 'type', ...typeInfo });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Search results for "${query}":\n\n${JSON.stringify(results, null, 2)}`,
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
      throw new Error(`Query "${queryName}" not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Query: ${query.name}\n\n${JSON.stringify(query, null, 2)}`,
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
      throw new Error(`Mutation "${mutationName}" not found`);
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
      throw new Error(`Type "${typeName}" not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Type: ${type.name}\n\n${JSON.stringify(type, null, 2)}`,
        },
      ],
    };
  }

  private async listOperations(operationType: string = 'all') {
    if (this.queries.size === 0 || this.mutations.size === 0) {
      await this.fetchDocumentation();
    }

    let content = '';

    if (operationType === 'all' || operationType === 'queries') {
      content += `## Queries (${this.queries.size})\n\n`;
      for (const [name, query] of this.queries) {
        content += `- **${name}**: ${query.description || 'No description'}\n`;
      }
      content += '\n';
    }

    if (operationType === 'all' || operationType === 'mutations') {
      content += `## Mutations (${this.mutations.size})\n\n`;
      for (const [name, mutation] of this.mutations) {
        content += `- **${name}**: ${mutation.description || 'No description'}\n`;
      }
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

  private async getApiEndpoints() {
    return {
      content: [
        {
          type: 'text',
          text: `# Superops.ai GraphQL API Endpoints

## Production Endpoints

### US Data Center
- **URL**: https://api.superops.ai/msp
- **Region**: United States

### EU Data Center  
- **URL**: https://euapi.superops.ai/msp
- **Region**: Europe

## Authentication
The API uses authentication headers. Check the Superops.ai documentation for current authentication methods.

## API Guide
For tutorial-oriented API documentation, visit:
https://support.superops.com/en/collections/3666305-api-documentation`,
        },
      ],
    };
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Superops.ai MCP server running on stdio');
  }
}

const server = new SuperopsDocumentationMCP();
server.run().catch(console.error);