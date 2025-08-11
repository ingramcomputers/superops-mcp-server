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
    const endpoints: { [key: string]: string } = {};
    
    // Find endpoint information in the documentation
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
      let current