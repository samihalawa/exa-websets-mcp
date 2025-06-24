import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "../config.js";
import { WebsetSearch, WebsetSearchInput } from "../../types.js";
import { createRequestLogger } from "../../utils/logger.js";

export function registerWebsetSearchTools(server: McpServer, config?: { exaApiKey?: string }): void {
  // Create Webset Search Tool
  server.tool(
    "create_webset_search_exa",
    "Create a new search within an existing Webset. The search will find and verify items based on your query and criteria. You can control whether it overrides or appends to existing items.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      query: z.string().describe("Search query for finding items. URLs will be crawled for context."),
      count: z.number().optional().describe("Target number of items to find (default: 10)"),
      entity: z.object({
        type: z.enum(['company', 'person', 'article', 'research_paper', 'custom']).describe("Entity type to focus on")
      }).optional().describe("Entity type (auto-detected if not provided)"),
      criteria: z.array(z.object({
        description: z.string().describe("Specific criterion for evaluation (e.g., 'Must have office in California')")
      })).optional().describe("Evaluation criteria (auto-detected if not provided)"),
      behavior: z.enum(['override', 'append']).optional().describe("Override replaces existing items, append adds to them (default: override)")
    },
    async ({ websetId, ...searchData }) => {
      const requestId = `create_webset_search_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_webset_search_exa');
      
      logger.start(`Creating search for Webset: ${websetId}`);
      
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

        const requestBody: WebsetSearchInput = {
          query: searchData.query,
          ...(searchData.count !== undefined && { count: searchData.count }),
          ...(searchData.entity && { entity: searchData.entity }),
          ...(searchData.criteria && { criteria: searchData.criteria }),
          ...(searchData.behavior && { behavior: searchData.behavior })
        };
        
        logger.log(`Creating search with query: "${requestBody.query}"`);
        
        const url = API_CONFIG.ENDPOINTS.WEBSET_SEARCHES.replace(':websetId', websetId);
        const response = await axiosInstance.post<WebsetSearch>(url, requestBody);
        
        logger.log(`Search created with ID: ${response.data.id}, status: ${response.data.status}`);
        
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
              text: `Create search error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Create search error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Get Webset Search Tool
  server.tool(
    "get_webset_search_exa",
    "Get details of a specific search within a Webset including its status, progress, and results count.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      searchId: z.string().describe("The unique identifier of the Search")
    },
    async ({ websetId, searchId }) => {
      const requestId = `get_webset_search_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webset_search_exa');
      
      logger.start(`Getting search ${searchId} from Webset ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_SEARCH_BY_ID
          .replace(':websetId', websetId)
          .replace(':searchId', searchId);
        
        const response = await axiosInstance.get<WebsetSearch>(url);
        
        logger.log(`Retrieved search with status: ${response.data.status}`);
        
        // Format the response for better readability
        const formattedResult = {
          id: response.data.id,
          status: response.data.status,
          query: response.data.query,
          targetCount: response.data.count,
          behavior: response.data.behavior,
          entity: response.data.entity,
          criteria: response.data.criteria,
          progress: response.data.progress,
          ...(response.data.canceledAt && {
            canceledAt: response.data.canceledAt,
            canceledReason: response.data.canceledReason
          }),
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
          metadata: response.data.metadata
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
              text: `Get search error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Get search error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // List Webset Searches Tool
  server.tool(
    "list_webset_searches_exa",
    "List all searches for a specific Webset. This shows all search operations including their status, query, and progress.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      cursor: z.string().optional().describe("Pagination cursor from previous response"),
      limit: z.number().optional().describe("Number of results per page (default: 25, max: 200)")
    },
    async ({ websetId, cursor, limit }) => {
      const requestId = `list_webset_searches_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_webset_searches_exa');
      
      logger.start(`Listing searches for Webset: ${websetId}`);
      
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
        if (cursor) params.append('cursor', cursor);
        if (limit) params.append('limit', limit.toString());
        
        const url = API_CONFIG.ENDPOINTS.WEBSET_SEARCHES.replace(':websetId', websetId);
        const response = await axiosInstance.get(url, { params });
        
        // Note: The response structure might be an array or paginated list
        // Adjust based on actual API response
        const searches = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        logger.log(`Retrieved ${searches.length} searches`);
        
        const formattedResult = {
          websetId: websetId,
          searchCount: searches.length,
          searches: searches.map((search: WebsetSearch) => ({
            id: search.id,
            status: search.status,
            query: search.query,
            targetCount: search.count,
            progress: search.progress,
            createdAt: search.createdAt
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
              text: `List searches error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `List searches error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Cancel Webset Search Tool
  server.tool(
    "cancel_webset_search_exa",
    "Cancel a specific running search within a Webset. This stops the search operation but keeps the results found so far.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      searchId: z.string().describe("The unique identifier of the Search to cancel")
    },
    async ({ websetId, searchId }) => {
      const requestId = `cancel_webset_search_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'cancel_webset_search_exa');
      
      logger.start(`Canceling search ${searchId} in Webset ${websetId}`);
      
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

        const url = API_CONFIG.ENDPOINTS.WEBSET_SEARCH_CANCEL
          .replace(':websetId', websetId)
          .replace(':searchId', searchId);
        
        const response = await axiosInstance.post<WebsetSearch>(url);
        
        logger.log('Search canceled successfully');
        
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
              text: `Cancel search error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Cancel search error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}