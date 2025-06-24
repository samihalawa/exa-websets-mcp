#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Import tool implementations
import { registerWebSearchTool } from "./tools/webSearch.js";
import { registerResearchPaperSearchTool } from "./tools/researchPaperSearch.js";
import { registerCompanyResearchTool } from "./tools/companyResearch.js";
import { registerCrawlingTool } from "./tools/crawling.js";
import { registerCompetitorFinderTool } from "./tools/competitorFinder.js";
import { registerLinkedInSearchTool } from "./tools/linkedInSearch.js";
import { registerWikipediaSearchTool } from "./tools/wikipediaSearch.js";
import { registerGithubSearchTool } from "./tools/githubSearch.js";
import { registerContentsTool } from "./tools/contents.js";
import { registerFindSimilarTool } from "./tools/findSimilar.js";
import { registerAnswerTool } from "./tools/answer.js";
import { registerResearchTool } from "./tools/research.js";

// Import Websets API tools
import {
  registerWebsetManagementTools,
  registerWebsetSearchTools,
  registerWebsetEnrichmentTools,
  registerWebsetItemTools,
  registerWebsetOperationTools
} from "./tools/websets/index.js";

import { log } from "./utils/logger.js";

// Configuration schema for the EXA API key and tool selection
export const configSchema = z.object({
  exaApiKey: z.string().optional().describe("Exa AI API key for search operations"),
  enabledTools: z.array(z.string()).optional().describe("List of tools to enable (if not specified, all tools are enabled)"),
  debug: z.boolean().default(false).describe("Enable debug logging")
});

// Tool registry for managing available tools
const availableTools = {
  // Search API tools
  'web_search_exa': { name: 'Web Search (Exa)', description: 'Advanced web search with semantic understanding and content extraction', enabled: true },
  'get_contents_exa': { name: 'Get Contents', description: 'Retrieve full content from specific URLs with extraction options', enabled: true },
  'find_similar_exa': { name: 'Find Similar', description: 'Find pages semantically similar to a given URL', enabled: true },
  'answer_with_citations_exa': { name: 'Answer with Citations', description: 'Generate answers to questions with web citations', enabled: true },
  'deep_research_exa': { name: 'Deep Research', description: 'Conduct comprehensive research with structured output', enabled: true },
  'check_research_status_exa': { name: 'Check Research Status', description: 'Check status of research tasks', enabled: true },
  'research_paper_search_exa': { name: 'Research Paper Search', description: 'Search academic papers and research', enabled: true },
  'company_research_exa': { name: 'Company Research', description: 'Research companies and organizations', enabled: true },
  'crawling_exa': { name: 'Web Crawling', description: 'Extract content from specific URLs', enabled: true },
  'competitor_finder_exa': { name: 'Competitor Finder', description: 'Find business competitors', enabled: true },
  'linkedin_search_exa': { name: 'LinkedIn Search', description: 'Search LinkedIn profiles and companies', enabled: true },
  'wikipedia_search_exa': { name: 'Wikipedia Search', description: 'Search Wikipedia articles', enabled: true },
  'github_search_exa': { name: 'GitHub Search', description: 'Search GitHub repositories and code', enabled: true },
  
  // Websets API tools - Management
  'create_webset_exa': { name: 'Create Webset', description: 'Create a new Webset for targeted search and enrichment', enabled: true },
  'list_websets_exa': { name: 'List Websets', description: 'List all Websets with pagination', enabled: true },
  'get_webset_exa': { name: 'Get Webset', description: 'Get detailed information about a specific Webset', enabled: true },
  'update_webset_exa': { name: 'Update Webset', description: 'Update Webset metadata or status', enabled: true },
  'delete_webset_exa': { name: 'Delete Webset', description: 'Delete a Webset and all its data', enabled: true },
  'cancel_webset_exa': { name: 'Cancel Webset', description: 'Cancel all running operations for a Webset', enabled: true },
  
  // Websets API tools - Search
  'create_webset_search_exa': { name: 'Create Webset Search', description: 'Create a search within a Webset', enabled: true },
  'get_webset_search_exa': { name: 'Get Webset Search', description: 'Get details of a specific search', enabled: true },
  'list_webset_searches_exa': { name: 'List Webset Searches', description: 'List all searches for a Webset', enabled: true },
  'cancel_webset_search_exa': { name: 'Cancel Webset Search', description: 'Cancel a running search', enabled: true },
  
  // Websets API tools - Enrichment
  'create_webset_enrichment_exa': { name: 'Create Webset Enrichment', description: 'Create an enrichment task', enabled: true },
  'get_webset_enrichment_exa': { name: 'Get Webset Enrichment', description: 'Get enrichment details', enabled: true },
  'list_webset_enrichments_exa': { name: 'List Webset Enrichments', description: 'List all enrichments', enabled: true },
  'delete_webset_enrichment_exa': { name: 'Delete Webset Enrichment', description: 'Delete an enrichment', enabled: true },
  'cancel_webset_enrichment_exa': { name: 'Cancel Webset Enrichment', description: 'Cancel a running enrichment', enabled: true },
  
  // Websets API tools - Items
  'list_webset_items_exa': { name: 'List Webset Items', description: 'List all items in a Webset', enabled: true },
  'get_webset_item_exa': { name: 'Get Webset Item', description: 'Get detailed item information', enabled: true },
  'delete_webset_item_exa': { name: 'Delete Webset Item', description: 'Delete an item from a Webset', enabled: true },
  'search_webset_items_exa': { name: 'Search Webset Items', description: 'Search and filter items', enabled: true },
  
  // Websets API tools - Operations
  'create_import_exa': { name: 'Create Import', description: 'Import data from external sources', enabled: true },
  'get_import_exa': { name: 'Get Import', description: 'Get import job details', enabled: true },
  'create_webset_monitor_exa': { name: 'Create Monitor', description: 'Create a monitor for periodic searches', enabled: true },
  'update_webset_monitor_exa': { name: 'Update Monitor', description: 'Update monitor settings', enabled: true },
  'create_webhook_exa': { name: 'Create Webhook', description: 'Create webhook for event notifications', enabled: true },
  'list_webhook_attempts_exa': { name: 'List Webhook Attempts', description: 'List webhook delivery attempts', enabled: true },
  'list_events_exa': { name: 'List Events', description: 'List system events', enabled: true },
  'get_event_exa': { name: 'Get Event', description: 'Get event details', enabled: true }
};

/**
 * Exa AI Web Search MCP Server
 * 
 * This MCP server integrates Exa AI's search capabilities with Claude and other MCP-compatible clients.
 * Exa is a search engine and API specifically designed for up-to-date web searching and retrieval,
 * offering more recent and comprehensive results than what might be available in an LLM's training data.
 * 
 * The server provides tools that enable:
 * - Real-time web searching with configurable parameters
 * - Research paper searches
 * - Company research and analysis
 * - Competitive intelligence
 * - And more!
 */

export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  try {
    // Set the API key in environment for tool functions to use
    // process.env.EXA_API_KEY = config.exaApiKey;
    
    if (config.debug) {
      log("Starting Exa MCP Server in debug mode");
    }

    // Create MCP server
    const server = new McpServer({
      name: "exa-search-server",
      version: "1.0.0"
    });
    
    log("Server initialized with modern MCP SDK and Smithery CLI support");

    // Helper function to check if a tool should be registered
    const shouldRegisterTool = (toolId: string): boolean => {
      if (config.enabledTools && config.enabledTools.length > 0) {
        return config.enabledTools.includes(toolId);
      }
      return availableTools[toolId as keyof typeof availableTools]?.enabled ?? false;
    };

    // Register tools based on configuration
    const registeredTools: string[] = [];
    
    if (shouldRegisterTool('web_search_exa')) {
      registerWebSearchTool(server, config);
      registeredTools.push('web_search_exa');
    }
    
    if (shouldRegisterTool('get_contents_exa')) {
      registerContentsTool(server, config);
      registeredTools.push('get_contents_exa');
    }
    
    if (shouldRegisterTool('find_similar_exa')) {
      registerFindSimilarTool(server, config);
      registeredTools.push('find_similar_exa');
    }
    
    if (shouldRegisterTool('answer_with_citations_exa')) {
      registerAnswerTool(server, config);
      registeredTools.push('answer_with_citations_exa');
    }
    
    if (shouldRegisterTool('deep_research_exa') || shouldRegisterTool('check_research_status_exa')) {
      registerResearchTool(server, config);
      if (shouldRegisterTool('deep_research_exa')) registeredTools.push('deep_research_exa');
      if (shouldRegisterTool('check_research_status_exa')) registeredTools.push('check_research_status_exa');
    }
    
    if (shouldRegisterTool('research_paper_search_exa')) {
      registerResearchPaperSearchTool(server, config);
      registeredTools.push('research_paper_search_exa');
    }
    
    if (shouldRegisterTool('company_research_exa')) {
      registerCompanyResearchTool(server, config);
      registeredTools.push('company_research_exa');
    }
    
    if (shouldRegisterTool('crawling_exa')) {
      registerCrawlingTool(server, config);
      registeredTools.push('crawling_exa');
    }
    
    if (shouldRegisterTool('competitor_finder_exa')) {
      registerCompetitorFinderTool(server, config);
      registeredTools.push('competitor_finder_exa');
    }
    
    if (shouldRegisterTool('linkedin_search_exa')) {
      registerLinkedInSearchTool(server, config);
      registeredTools.push('linkedin_search_exa');
    }
    
    if (shouldRegisterTool('wikipedia_search_exa')) {
      registerWikipediaSearchTool(server, config);
      registeredTools.push('wikipedia_search_exa');
    }
    
    if (shouldRegisterTool('github_search_exa')) {
      registerGithubSearchTool(server, config);
      registeredTools.push('github_search_exa');
    }
    
    // Register Websets API tools
    const websetTools = [
      'create_webset_exa', 'list_websets_exa', 'get_webset_exa', 
      'update_webset_exa', 'delete_webset_exa', 'cancel_webset_exa'
    ];
    const websetSearchTools = [
      'create_webset_search_exa', 'get_webset_search_exa',
      'list_webset_searches_exa', 'cancel_webset_search_exa'
    ];
    const websetEnrichmentTools = [
      'create_webset_enrichment_exa', 'get_webset_enrichment_exa',
      'list_webset_enrichments_exa', 'delete_webset_enrichment_exa',
      'cancel_webset_enrichment_exa'
    ];
    const websetItemTools = [
      'list_webset_items_exa', 'get_webset_item_exa',
      'delete_webset_item_exa', 'search_webset_items_exa'
    ];
    const websetOperationTools = [
      'create_import_exa', 'get_import_exa',
      'create_webset_monitor_exa', 'update_webset_monitor_exa',
      'create_webhook_exa', 'list_webhook_attempts_exa',
      'list_events_exa', 'get_event_exa'
    ];
    
    // Register Webset Management tools
    if (websetTools.some(tool => shouldRegisterTool(tool))) {
      registerWebsetManagementTools(server, config);
      websetTools.forEach(tool => {
        if (shouldRegisterTool(tool)) registeredTools.push(tool);
      });
    }
    
    // Register Webset Search tools
    if (websetSearchTools.some(tool => shouldRegisterTool(tool))) {
      registerWebsetSearchTools(server, config);
      websetSearchTools.forEach(tool => {
        if (shouldRegisterTool(tool)) registeredTools.push(tool);
      });
    }
    
    // Register Webset Enrichment tools
    if (websetEnrichmentTools.some(tool => shouldRegisterTool(tool))) {
      registerWebsetEnrichmentTools(server, config);
      websetEnrichmentTools.forEach(tool => {
        if (shouldRegisterTool(tool)) registeredTools.push(tool);
      });
    }
    
    // Register Webset Item tools
    if (websetItemTools.some(tool => shouldRegisterTool(tool))) {
      registerWebsetItemTools(server, config);
      websetItemTools.forEach(tool => {
        if (shouldRegisterTool(tool)) registeredTools.push(tool);
      });
    }
    
    // Register Webset Operation tools
    if (websetOperationTools.some(tool => shouldRegisterTool(tool))) {
      registerWebsetOperationTools(server, config);
      websetOperationTools.forEach(tool => {
        if (shouldRegisterTool(tool)) registeredTools.push(tool);
      });
    }
    
    if (config.debug) {
      log(`Registered ${registeredTools.length} tools: ${registeredTools.join(', ')}`);
    }
    
    // Return the server object (Smithery CLI handles transport)
    return server.server;
    
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}