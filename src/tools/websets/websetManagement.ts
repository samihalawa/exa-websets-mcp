import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "../config.js";
import { 
  Webset, 
  CreateWebsetInput, 
  UpdateWebsetInput,
  PaginatedWebsetList 
} from "../../types.js";
import { createRequestLogger } from "../../utils/logger.js";

export function registerWebsetManagementTools(server: McpServer, config?: { exaApiKey?: string }): void {
  // Create Webset Tool
  server.tool(
    "create_webset_exa",
    "Create a new Webset for targeted search and enrichment. A Webset is a container for managing searches, enrichments, and monitoring of web content. Optionally include initial search and enrichment tasks.",
    {
      search: z.object({
        query: z.string().describe("Search query for finding items. URLs will be crawled for context."),
        count: z.number().optional().describe("Target number of items to find (default: 10)"),
        entity: z.object({
          type: z.enum(['company', 'person', 'article', 'research_paper', 'custom']).describe("Entity type to focus on")
        }).optional().describe("Entity type (auto-detected if not provided)"),
        criteria: z.array(z.object({
          description: z.string().describe("Evaluation criterion")
        })).optional().describe("Specific criteria for evaluation (auto-detected if not provided)"),
        behavior: z.enum(['override', 'append']).optional().describe("How to handle existing items (default: override)")
      }).optional().describe("Initial search configuration"),
      enrichments: z.array(z.object({
        description: z.string().describe("Description of data to extract"),
        format: z.enum(['text', 'date', 'number', 'options', 'email', 'phone']).optional().describe("Expected format (auto-detected if not provided)"),
        options: z.array(z.object({
          label: z.string()
        })).optional().describe("Predefined options (required if format is 'options')"),
        metadata: z.record(z.string()).optional().describe("Key-value metadata")
      })).optional().describe("Initial enrichment tasks"),
      externalId: z.string().optional().describe("Your own identifier for the Webset"),
      metadata: z.record(z.string()).optional().describe("Key-value metadata for the Webset")
    },
    async (args) => {
      const requestId = `create_webset_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_webset_exa');
      
      logger.start('Creating new Webset');
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const requestBody: CreateWebsetInput = {
          ...(args.search && { search: args.search }),
          ...(args.enrichments && { enrichments: args.enrichments }),
          ...(args.externalId && { externalId: args.externalId }),
          ...(args.metadata && { metadata: args.metadata })
        };
        
        logger.log(`Creating Webset with ${Object.keys(requestBody).length} parameters`);
        
        const response = await axiosInstance.post<Webset>(
          API_CONFIG.ENDPOINTS.WEBSETS,
          requestBody
        );
        
        logger.log(`Webset created with ID: ${response.data.id}`);
        
        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.error || error.message;
          
          return {
            content: [{
              type: "text" as const,
              text: `Create Webset error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Create Webset error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // List Websets Tool
  server.tool(
    "list_websets_exa",
    "List all Websets with pagination support. Returns Websets with their current status, searches, enrichments, and metadata.",
    {
      cursor: z.string().optional().describe("Pagination cursor from previous response"),
      limit: z.number().optional().describe("Number of results per page (default: 25, max: 200)")
    },
    async (args) => {
      const requestId = `list_websets_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_websets_exa');
      
      logger.start('Listing Websets');
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const params = new URLSearchParams();
        if (args.cursor) params.append('cursor', args.cursor);
        if (args.limit) params.append('limit', args.limit.toString());
        
        const response = await axiosInstance.get<PaginatedWebsetList>(
          API_CONFIG.ENDPOINTS.WEBSETS,
          { params }
        );
        
        logger.log(`Retrieved ${response.data.data.length} Websets`);
        
        const formattedResult = {
          totalWebsets: response.data.data.length,
          hasMore: response.data.hasMore,
          nextCursor: response.data.nextCursor,
          websets: response.data.data.map(webset => ({
            id: webset.id,
            status: webset.status,
            externalId: webset.externalId,
            searchCount: webset.searches?.length || 0,
            enrichmentCount: webset.enrichments?.length || 0,
            monitorCount: webset.monitors?.length || 0,
            createdAt: webset.createdAt,
            updatedAt: webset.updatedAt,
            metadata: webset.metadata
          }))
        };
        
        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(formattedResult, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.error || error.message;
          
          return {
            content: [{
              type: "text" as const,
              text: `List Websets error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `List Websets error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Get Webset Tool
  server.tool(
    "get_webset_exa",
    "Get detailed information about a specific Webset including its searches, enrichments, monitors, and current status.",
    {
      websetId: z.string().describe("The unique identifier of the Webset")
    },
    async ({ websetId }) => {
      const requestId = `get_webset_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webset_exa');
      
      logger.start(`Getting Webset: ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_BY_ID.replace(':websetId', websetId);
        const response = await axiosInstance.get<Webset>(url);
        
        logger.log(`Retrieved Webset with status: ${response.data.status}`);
        
        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.error || error.message;
          
          return {
            content: [{
              type: "text" as const,
              text: `Get Webset error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Get Webset error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Update Webset Tool
  server.tool(
    "update_webset_exa",
    "Update a Webset's metadata, external ID, or status (pause/resume). Use this to modify Webset properties or control its execution state.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      externalId: z.string().optional().describe("Update the external identifier"),
      metadata: z.record(z.string()).optional().describe("Update or add key-value metadata"),
      status: z.enum(['paused', 'running']).optional().describe("Pause or resume the Webset")
    },
    async ({ websetId, ...updateData }) => {
      const requestId = `update_webset_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'update_webset_exa');
      
      logger.start(`Updating Webset: ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const requestBody: UpdateWebsetInput = {
          ...(updateData.externalId !== undefined && { externalId: updateData.externalId }),
          ...(updateData.metadata && { metadata: updateData.metadata }),
          ...(updateData.status && { status: updateData.status })
        };
        
        const url = API_CONFIG.ENDPOINTS.WEBSET_BY_ID.replace(':websetId', websetId);
        const response = await axiosInstance.post<Webset>(url, requestBody);
        
        logger.log('Webset updated successfully');
        
        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.error || error.message;
          
          return {
            content: [{
              type: "text" as const,
              text: `Update Webset error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Update Webset error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Delete Webset Tool
  server.tool(
    "delete_webset_exa",
    "Delete a specific Webset and all its associated data including searches, enrichments, items, and monitors.",
    {
      websetId: z.string().describe("The unique identifier of the Webset to delete")
    },
    async ({ websetId }) => {
      const requestId = `delete_webset_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_webset_exa');
      
      logger.start(`Deleting Webset: ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_BY_ID.replace(':websetId', websetId);
        await axiosInstance.delete(url);
        
        logger.log('Webset deleted successfully');
        
        const result = {
          content: [{
            type: "text" as const,
            text: `Webset ${websetId} has been successfully deleted.`
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.error || error.message;
          
          return {
            content: [{
              type: "text" as const,
              text: `Delete Webset error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Delete Webset error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Cancel Webset Tool
  server.tool(
    "cancel_webset_exa",
    "Cancel all running operations for a specific Webset including searches, enrichments, and monitors. The Webset itself remains but all active tasks are stopped.",
    {
      websetId: z.string().describe("The unique identifier of the Webset")
    },
    async ({ websetId }) => {
      const requestId = `cancel_webset_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'cancel_webset_exa');
      
      logger.start(`Canceling operations for Webset: ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_CANCEL.replace(':websetId', websetId);
        const response = await axiosInstance.post<Webset>(url);
        
        logger.log('Webset operations canceled successfully');
        
        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.error || error.message;
          
          return {
            content: [{
              type: "text" as const,
              text: `Cancel Webset error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Cancel Webset error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}