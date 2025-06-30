#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Websets-only MCP Server - no Search API tools imported

// Import Websets API tools
import {
  registerWebsetManagementTools,
  registerWebsetSearchTools,
  registerWebsetEnrichmentTools,
  registerWebsetItemTools,
  registerWebsetOperationTools,
  registerWebsetExportTools,
  registerWebsetBatchTools
} from "./tools/websets/index.js";

import { log } from "./utils/logger.js";

// Configuration schema for the EXA API key and tool selection
export const configSchema = z.object({
  exaApiKey: z.string().describe("Exa AI API key for Websets operations (required)"),
  enabledTools: z.array(z.string()).optional().describe("List of tools to enable (if not specified, all tools are enabled)"),
  debug: z.boolean().default(false).describe("Enable debug logging")
});

// Tool registry for Websets API tools only
const availableTools = {
  
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
  'list_imports_exa': { name: 'List Imports', description: 'List all import jobs', enabled: true },
  'update_import_exa': { name: 'Update Import', description: 'Update import (cancel)', enabled: true },
  'delete_import_exa': { name: 'Delete Import', description: 'Delete an import job', enabled: true },
  'create_webset_monitor_exa': { name: 'Create Monitor', description: 'Create a monitor for periodic searches', enabled: true },
  'get_webset_monitor_exa': { name: 'Get Monitor', description: 'Get monitor details', enabled: true },
  'list_webset_monitors_exa': { name: 'List Monitors', description: 'List all monitors for a webset', enabled: true },
  'update_webset_monitor_exa': { name: 'Update Monitor', description: 'Update monitor settings', enabled: true },
  'delete_webset_monitor_exa': { name: 'Delete Monitor', description: 'Delete a monitor', enabled: true },
  'list_monitor_runs_exa': { name: 'List Monitor Runs', description: 'List all runs for a monitor', enabled: true },
  'get_monitor_run_exa': { name: 'Get Monitor Run', description: 'Get details of a monitor run', enabled: true },
  'create_webhook_exa': { name: 'Create Webhook', description: 'Create webhook for event notifications', enabled: true },
  'get_webhook_exa': { name: 'Get Webhook', description: 'Get webhook details', enabled: true },
  'list_webhooks_exa': { name: 'List Webhooks', description: 'List all webhooks', enabled: true },
  'update_webhook_exa': { name: 'Update Webhook', description: 'Update webhook configuration', enabled: true },
  'delete_webhook_exa': { name: 'Delete Webhook', description: 'Delete a webhook', enabled: true },
  'list_webhook_attempts_exa': { name: 'List Webhook Attempts', description: 'List webhook delivery attempts', enabled: true },
  'list_events_exa': { name: 'List Events', description: 'List system events', enabled: true },
  'get_event_exa': { name: 'Get Event', description: 'Get event details', enabled: true },
  
  // Websets API tools - Export
  'create_export_exa': { name: 'Create Export', description: 'Export webset items in various formats', enabled: true },
  'get_export_exa': { name: 'Get Export', description: 'Get export job status and download URL', enabled: true },
  'list_exports_exa': { name: 'List Exports', description: 'List all export jobs for a webset', enabled: true },
  'delete_export_exa': { name: 'Delete Export', description: 'Delete an export job', enabled: true },
  
  // Websets API tools - Batch Operations
  'update_webset_item_exa': { name: 'Update Item', description: 'Update a single webset item', enabled: true },
  'batch_update_items_exa': { name: 'Batch Update Items', description: 'Update multiple items at once', enabled: true },
  'batch_delete_items_exa': { name: 'Batch Delete Items', description: 'Delete multiple items at once', enabled: true },
  'batch_verify_items_exa': { name: 'Batch Verify Items', description: 'Verify multiple items at once', enabled: true }
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
    // Handle configuration from environment variables when available
    const finalConfig = {
      exaApiKey: config.exaApiKey || process.env.EXA_API_KEY,
      enabledTools: config.enabledTools || (process.env.ENABLED_TOOLS ? process.env.ENABLED_TOOLS.split(',') : undefined),
      debug: config.debug || process.env.DEBUG_MODE === 'true'
    };

    // Validate API key is available
    if (!finalConfig.exaApiKey) {
      throw new Error("EXA_API_KEY is required but not provided in config or environment");
    }

    // Set the API key in environment for tool functions to use
    process.env.EXA_API_KEY = finalConfig.exaApiKey;
    
    if (finalConfig.debug) {
      log("Starting Exa Websets MCP Server in debug mode");
    }

    // Create MCP server
    const server = new McpServer({
      name: "exa-websets-server", 
      version: "1.0.0"
    });
    
    log("Server initialized with modern MCP SDK and Smithery CLI support");

    // Helper function to check if a tool should be registered
    const shouldRegisterTool = (toolId: string): boolean => {
      if (finalConfig.enabledTools && finalConfig.enabledTools.length > 0) {
        return finalConfig.enabledTools.includes(toolId);
      }
      return availableTools[toolId as keyof typeof availableTools]?.enabled ?? false;
    };

    // Register Websets API tools only - no Search API tools
    const registeredTools: string[] = [];
    
    // Register Websets API tools - Organized by workflow priority
    
    // Core Discovery & Management Tools (Most Used Daily)
    const websetCoreTools = [
      'create_webset_exa',           // Start lead discovery
      'list_webset_items_exa',       // View discovered leads
      'get_webset_item_exa',         // Deep dive into leads
      'list_websets_exa',            // Manage all websets
      'get_webset_exa',              // Check webset status
      'search_webset_items_exa'      // Filter and find specific items
    ];
    
    // Enrichment Tools (Critical for Contact Data)
    const websetEnrichmentTools = [
      'create_webset_enrichment_exa',     // Add email/phone/LinkedIn enrichments
      'list_webset_enrichments_exa',      // Monitor enrichment progress
      'get_webset_enrichment_exa',        // Check enrichment details
      'delete_webset_enrichment_exa',     // Remove enrichments
      'cancel_webset_enrichment_exa'      // Stop running enrichments
    ];
    
    // Import & Automation Tools (Weekly High-Value)
    const websetAutomationTools = [
      'create_import_exa',                // Import CSV/JSON data
      'get_import_exa',                   // Check import status
      'list_imports_exa',                 // List all imports
      'update_import_exa',                // Cancel imports
      'delete_import_exa',                // Delete imports
      'create_webset_monitor_exa',        // Set up automated monitoring
      'get_webset_monitor_exa',           // Get monitor details
      'list_webset_monitors_exa',         // List all monitors
      'update_webset_monitor_exa',        // Adjust monitor settings
      'delete_webset_monitor_exa',        // Delete monitors
      'list_monitor_runs_exa',            // View monitor run history
      'get_monitor_run_exa',              // Get run details
      'create_webhook_exa',               // Real-time notifications
      'get_webhook_exa',                  // Get webhook details
      'list_webhooks_exa',                // List all webhooks
      'update_webhook_exa',               // Update webhook config
      'delete_webhook_exa',               // Delete webhooks
      'list_webhook_attempts_exa'         // Debug webhooks
    ];
    
    // Export Tools (Data Output)
    const websetExportTools = [
      'create_export_exa',                // Export to CSV/JSON/XLSX
      'get_export_exa',                   // Get export status and download URL
      'list_exports_exa',                 // List all exports
      'delete_export_exa'                 // Delete exports
    ];
    
    // Search & Data Management Tools
    const websetManagementTools = [
      'create_webset_search_exa',         // Add searches to websets
      'get_webset_search_exa',            // Check search progress
      'list_webset_searches_exa',         // View all searches
      'cancel_webset_search_exa',         // Stop searches
      'update_webset_exa',                // Update metadata/tags
      'delete_webset_exa',                // Delete websets
      'delete_webset_item_exa',           // Remove items
      'cancel_webset_exa'                 // Cancel all operations
    ];
    
    // System Monitoring Tools
    const websetSystemTools = [
      'list_events_exa',                  // Monitor system events
      'get_event_exa'                     // Event details
    ];
    
    // Batch Operations Tools
    const websetBatchTools = [
      'update_webset_item_exa',           // Update single item
      'batch_update_items_exa',           // Batch update items
      'batch_delete_items_exa',           // Batch delete items
      'batch_verify_items_exa'            // Batch verify items
    ];
    
    // Register all Websets tools based on workflow groupings
    const allWebsetTools = [
      ...websetCoreTools,
      ...websetEnrichmentTools,
      ...websetAutomationTools,
      ...websetExportTools,
      ...websetBatchTools,
      ...websetManagementTools,
      ...websetSystemTools
    ];
    
    // Check which registration functions we need to call
    const needsManagement = [...websetCoreTools, ...websetManagementTools]
      .some(tool => shouldRegisterTool(tool));
    const needsSearch = websetManagementTools
      .filter(t => t.includes('search'))
      .some(tool => shouldRegisterTool(tool));
    const needsEnrichment = websetEnrichmentTools
      .some(tool => shouldRegisterTool(tool));
    const needsItems = websetCoreTools
      .filter(t => t.includes('item'))
      .some(tool => shouldRegisterTool(tool));
    const needsOperations = [...websetAutomationTools, ...websetSystemTools]
      .some(tool => shouldRegisterTool(tool));
    const needsExport = websetExportTools
      .some(tool => shouldRegisterTool(tool));
    const needsBatch = websetBatchTools
      .some(tool => shouldRegisterTool(tool));
    
    // Register the tool groups
    if (needsManagement) {
      registerWebsetManagementTools(server, finalConfig);
    }
    if (needsSearch) {
      registerWebsetSearchTools(server, finalConfig);
    }
    if (needsEnrichment) {
      registerWebsetEnrichmentTools(server, finalConfig);
    }
    if (needsItems) {
      registerWebsetItemTools(server, finalConfig);
    }
    if (needsOperations) {
      registerWebsetOperationTools(server, finalConfig);
    }
    if (needsExport) {
      registerWebsetExportTools(server, finalConfig);
    }
    if (needsBatch) {
      registerWebsetBatchTools(server, finalConfig);
    }
    
    // Track which tools were registered
    allWebsetTools.forEach(tool => {
      if (shouldRegisterTool(tool)) {
        registeredTools.push(tool);
      }
    });
    
    if (finalConfig.debug) {
      log(`Registered ${registeredTools.length} tools: ${registeredTools.join(', ')}`);
    }
    
    // Return the server object (Smithery CLI handles transport)
    return server.server;
    
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}