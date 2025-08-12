// Enhanced documentation parser for better GraphQL parsing
// src/parser.ts

import * as cheerio from 'cheerio';

export interface GraphQLField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  deprecated?: boolean;
}

export interface GraphQLArgument extends GraphQLField {
  defaultValue?: string;
}

export interface GraphQLOperation {
  name: string;
  type: 'query' | 'mutation';
  description?: string;
  arguments?: GraphQLArgument[];
  returnType?: string;
  example?: {
    query: string;
    variables?: any;
    response?: any;
  };
  deprecated?: boolean;
}

export interface GraphQLType {
  name: string;
  kind: 'OBJECT' | 'INPUT_OBJECT' | 'ENUM' | 'SCALAR' | 'INTERFACE' | 'UNION';
  description?: string;
  fields?: GraphQLField[];
  enumValues?: Array<{
    name: string;
    description?: string;
    deprecated?: boolean;
  }>;
  interfaces?: string[];
  possibleTypes?: string[];
}

export class SuperopsDocumentationParser {
  private $: cheerio.CheerioAPI;

  constructor(html: string) {
    this.$ = cheerio.load(html);
  }

  public parseAll() {
    const endpoints = this.parseEndpoints();
    const queries = this.parseQueries();
    const mutations = this.parseMutations();
    const types = this.parseTypes();

    return {
      endpoints,
      queries,
      mutations,
      types,
      summary: {
        totalQueries: Object.keys(queries).length,
        totalMutations: Object.keys(mutations).length,
        totalTypes: Object.keys(types).length,
      }
    };
  }

  private parseEndpoints() {
    const endpoints = {
      us: 'https://api.superops.ai/msp',
      eu: 'https://euapi.superops.ai/msp'
    };
    
    // Look for any endpoint information in the documentation to verify
    this.$('p, div, code').each((_, element) => {
      const text = this.$(element).text();
      
      // Look for US endpoint
      const usMatch = text.match(/US data center.*?(https:\/\/api\.superops\.ai\/msp)/i);
      if (usMatch) {
        endpoints.us = usMatch[1];
      }
      
      // Look for EU endpoint  
      const euMatch = text.match(/EU data center.*?(https:\/\/euapi\.superops\.ai\/msp)/i);
      if (euMatch) {
        endpoints.eu = euMatch[1];
      }
    });

    return endpoints;
  }

  private parseQueries(): { [key: string]: GraphQLOperation } {
    const queries: { [key: string]: GraphQLOperation } = {};
    
    // Find the Queries section
    const queriesSection = this.$('h2').filter((_, el) => 
      this.$(el).text().trim().toLowerCase() === 'queries'
    );
    
    if (queriesSection.length) {
      let currentElement = queriesSection.next();
      
      while (currentElement.length && !currentElement.is('h2')) {
        if (currentElement.is('h3')) {
          const operation = this.parseOperation(currentElement, 'query');
          if (operation) {
            queries[operation.name] = operation;
          }
        }
        currentElement = currentElement.next();
      }
    }
    
    return queries;
  }

  private parseMutations(): { [key: string]: GraphQLOperation } {
    const mutations: { [key: string]: GraphQLOperation } = {};
    
    // Find the Mutations section
    const mutationsSection = this.$('h2').filter((_, el) => 
      this.$(el).text().trim().toLowerCase() === 'mutations'
    );
    
    if (mutationsSection.length) {
      let currentElement = mutationsSection.next();
      
      while (currentElement.length && !currentElement.is('h2')) {
        if (currentElement.is('h3')) {
          const operation = this.parseOperation(currentElement, 'mutation');
          if (operation) {
            mutations[operation.name] = operation;
          }
        }
        currentElement = currentElement.next();
      }
    }
    
    return mutations;
  }

  private parseOperation(element: cheerio.Cheerio, type: 'query' | 'mutation'): GraphQLOperation | null {
    const name = this.$(element).text().trim();
    if (!name) return null;

    const operation: GraphQLOperation = {
      name,
      type,
    };

    let currentElement = this.$(element).next();
    
    // Parse description
    if (currentElement.is('p') && currentElement.text().toLowerCase().startsWith('description')) {
      currentElement = currentElement.next();
      if (currentElement.is('p')) {
        operation.description = currentElement.text().trim();
        currentElement = currentElement.next();
      }
    }

    // Parse return type
    while (currentElement.length && !currentElement.is('h3, h2')) {
      if (currentElement.text().toLowerCase().includes('response') || 
          currentElement.text().toLowerCase().includes('returns')) {
        const returnText = currentElement.text();
        const returnMatch = returnText.match(/returns?\s+an?\s+([A-Za-z0-9_]+)/i);
        if (returnMatch) {
          operation.returnType = returnMatch[1];
        }
        currentElement = currentElement.next();
        break;
      }
      currentElement = currentElement.next();
    }

    // Parse arguments table
    while (currentElement.length && !currentElement.is('h3, h2')) {
      if (currentElement.is('table')) {
        operation.arguments = this.parseArgumentsTable(currentElement);
        currentElement = currentElement.next();
        break;
      }
      if (currentElement.text().toLowerCase().includes('arguments')) {
        currentElement = currentElement.next();
        if (currentElement.is('table')) {
          operation.arguments = this.parseArgumentsTable(currentElement);
          currentElement = currentElement.next();
          break;
        }
      }
      currentElement = currentElement.next();
    }

    // Parse example
    while (currentElement.length && !currentElement.is('h3, h2')) {
      if (currentElement.text().toLowerCase().includes('example')) {
        operation.example = this.parseExample(currentElement);
        break;
      }
      currentElement = currentElement.next();
    }

    return operation;
  }

  private parseArgumentsTable(table: cheerio.Cheerio): GraphQLArgument[] {
    const arguments: GraphQLArgument[] = [];
    
    this.$(table).find('tbody tr').each((_, row) => {
      const cells = this.$(row).find('td');
      if (cells.length >= 2) {
        const nameTypeCell = this.$(cells[0]).text().trim();
        const descriptionCell = this.$(cells[1]).text().trim();
        
        // Parse name and type from first cell (format: "name - type")
        const match = nameTypeCell.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*-\s*(.+)$/);
        if (match) {
          const [, name, typeInfo] = match;
          
          arguments.push({
            name,
            type: typeInfo.trim(),
            description: descriptionCell,
            required: typeInfo.includes('!'),
          });
        }
      }
    });
    
    return arguments;
  }

  private parseExample(element: cheerio.Cheerio): { query: string; variables?: any; response?: any } {
    const example: { query: string; variables?: any; response?: any } = {
      query: '',
    };

    let currentElement = this.$(element).next();
    
    while (currentElement.length && !currentElement.is('h3, h2')) {
      const text = currentElement.text().toLowerCase();
      
      if (text.includes('query') && currentElement.next().is('pre, code')) {
        example.query = currentElement.next().text().trim();
      } else if (text.includes('variables') && currentElement.next().is('pre, code')) {
        const variablesText = currentElement.next().text().trim();
        try {
          example.variables = JSON.parse(variablesText);
        } catch {
          example.variables = variablesText;
        }
      } else if (text.includes('response') && currentElement.next().is('pre, code')) {
        const responseText = currentElement.next().text().trim();
        try {
          example.response = JSON.parse(responseText);
        } catch {
          example.response = responseText;
        }
      }
      
      currentElement = currentElement.next();
    }

    return example;
  }

  private parseTypes(): { [key: string]: GraphQLType } {
    const types: { [key: string]: GraphQLType } = {};
    
    // Find the Types section
    const typesSection = this.$('h2').filter((_, el) => 
      this.$(el).text().trim().toLowerCase() === 'types'
    );
    
    if (typesSection.length) {
      let currentElement = typesSection.next();
      
      while (currentElement.length) {
        if (currentElement.is('h3')) {
          const type = this.parseType(currentElement);
          if (type) {
            types[type.name] = type;
          }
        }
        currentElement = currentElement.next();
      }
    }
    
    return types;
  }

  private parseType(element: cheerio.Cheerio): GraphQLType | null {
    const name = this.$(element).text().trim();
    if (!name) return null;

    const type: GraphQLType = {
      name,
      kind: this.inferTypeKind(name),
    };

    let currentElement = this.$(element).next();
    
    // Parse description
    if (currentElement.is('p') && currentElement.text().toLowerCase().startsWith('description')) {
      currentElement = currentElement.next();
      if (currentElement.is('p')) {
        type.description = currentElement.text().trim();
        currentElement = currentElement.next();
      }
    }

    // Parse fields table
    while (currentElement.length && !currentElement.is('h3, h2')) {
      if (currentElement.is('table')) {
        if (type.kind === 'ENUM') {
          type.enumValues = this.parseEnumValuesTable(currentElement);
        } else {
          type.fields = this.parseFieldsTable(currentElement);
        }
        break;
      }
      if (currentElement.text().toLowerCase().includes('fields') || 
          currentElement.text().toLowerCase().includes('values')) {
        currentElement = currentElement.next();
        if (currentElement.is('table')) {
          if (type.kind === 'ENUM') {
            type.enumValues = this.parseEnumValuesTable(currentElement);
          } else {
            type.fields = this.parseFieldsTable(currentElement);
          }
          break;
        }
      }
      currentElement = currentElement.next();
    }

    return type;
  }

  private parseFieldsTable(table: cheerio.Cheerio): GraphQLField[] {
    const fields: GraphQLField[] = [];
    
    this.$(table).find('tbody tr').each((_, row) => {
      const cells = this.$(row).find('td');
      if (cells.length >= 2) {
        const nameTypeCell = this.$(cells[0]).text().trim();
        const descriptionCell = this.$(cells[1]).text().trim();
        
        // Parse field name and type (format: "fieldName - FieldType" or "fieldName - FieldType!")
        const match = nameTypeCell.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*-\s*(.+)$/);
        if (match) {
          const [, name, typeInfo] = match;
          
          fields.push({
            name,
            type: typeInfo.trim(),
            description: descriptionCell,
            required: typeInfo.includes('!'),
          });
        }
      }
    });
    
    return fields;
  }

  private parseEnumValuesTable(table: cheerio.Cheerio): Array<{name: string; description?: string}> {
    const enumValues: Array<{name: string; description?: string}> = [];
    
    this.$(table).find('tbody tr').each((_, row) => {
      const cells = this.$(row).find('td');
      if (cells.length >= 1) {
        const nameCell = this.$(cells[0]).text().trim();
        const descriptionCell = cells.length > 1 ? this.$(cells[1]).text().trim() : undefined;
        
        if (nameCell) {
          enumValues.push({
            name: nameCell,
            description: descriptionCell,
          });
        }
      }
    });
    
    return enumValues;
  }

  private inferTypeKind(typeName: string): GraphQLType['kind'] {
    // Common naming patterns to infer GraphQL type kinds
    if (typeName.endsWith('Input')) {
      return 'INPUT_OBJECT';
    }
    if (typeName.endsWith('Enum') || typeName.toUpperCase() === typeName) {
      return 'ENUM';
    }
    if (['String', 'Int', 'Float', 'Boolean', 'ID', 'JSON'].includes(typeName)) {
      return 'SCALAR';
    }
    
    return 'OBJECT';
  }

  public searchOperations(query: string, operations: { [key: string]: GraphQLOperation }): GraphQLOperation[] {
    const searchLower = query.toLowerCase();
    const results: GraphQLOperation[] = [];
    
    for (const operation of Object.values(operations)) {
      // Search in operation name
      if (operation.name.toLowerCase().includes(searchLower)) {
        results.push(operation);
        continue;
      }
      
      // Search in description
      if (operation.description && operation.description.toLowerCase().includes(searchLower)) {
        results.push(operation);
        continue;
      }
      
      // Search in arguments
      if (operation.arguments) {
        const found = operation.arguments.some(arg => 
          arg.name.toLowerCase().includes(searchLower) ||
          arg.type.toLowerCase().includes(searchLower) ||
          (arg.description && arg.description.toLowerCase().includes(searchLower))
        );
        if (found) {
          results.push(operation);
          continue;
        }
      }
      
      // Search in return type
      if (operation.returnType && operation.returnType.toLowerCase().includes(searchLower)) {
        results.push(operation);
      }
    }
    
    return results;
  }

  public searchTypes(query: string, types: { [key: string]: GraphQLType }): GraphQLType[] {
    const searchLower = query.toLowerCase();
    const results: GraphQLType[] = [];
    
    for (const type of Object.values(types)) {
      // Search in type name
      if (type.name.toLowerCase().includes(searchLower)) {
        results.push(type);
        continue;
      }
      
      // Search in description
      if (type.description && type.description.toLowerCase().includes(searchLower)) {
        results.push(type);
        continue;
      }
      
      // Search in fields
      if (type.fields) {
        const found = type.fields.some(field => 
          field.name.toLowerCase().includes(searchLower) ||
          field.type.toLowerCase().includes(searchLower) ||
          (field.description && field.description.toLowerCase().includes(searchLower))
        );
        if (found) {
          results.push(type);
          continue;
        }
      }
      
      // Search in enum values
      if (type.enumValues) {
        const found = type.enumValues.some(enumValue => 
          enumValue.name.toLowerCase().includes(searchLower) ||
          (enumValue.description && enumValue.description.toLowerCase().includes(searchLower))
        );
        if (found) {
          results.push(type);
        }
      }
    }
    
    return results;
  }
}