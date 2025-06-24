import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "../config.js";
import { WebsetItem, PaginatedWebsetItemList } from "../../types.js";
import { createRequestLogger } from "../../utils/logger.js";

export function registerWebsetItemTools(server: McpServer, config?: { exaApiKey?: string }): void {
  // List Webset Items Tool
  server.tool(
    "list_webset_items_exa",
    "List all items found and verified within a Webset. Items include structured properties, webpage content, verification status, and enriched data.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      cursor: z.string().optional().describe("Pagination cursor from previous response"),
      limit: z.number().optional().describe("Number of results per page (default: 25, max: 200)")
    },
    async ({ websetId, cursor, limit }) => {
      const requestId = `list_webset_items_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_webset_items_exa');
      
      logger.start(`Listing items for Webset: ${websetId}`);
      
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
        
        const url = API_CONFIG.ENDPOINTS.WEBSET_ITEMS.replace(':websetId', websetId);
        const response = await axiosInstance.get<PaginatedWebsetItemList>(url, { params });
        
        logger.log(`Retrieved ${response.data.data.length} items`);
        
        const formattedResult = {
          websetId: websetId,
          itemCount: response.data.data.length,
          hasMore: response.data.hasMore,
          nextCursor: response.data.nextCursor,
          items: response.data.data.map(item => ({
            id: item.id,
            url: item.url,
            title: item.title,
            type: item.type,
            verificationStatus: item.verification?.status,
            hasEnrichedData: !!item.enrichedData && Object.keys(item.enrichedData).length > 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
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
              text: `List items error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `List items error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Get Webset Item Tool
  server.tool(
    "get_webset_item_exa",
    "Get detailed information about a specific item including its content, verification details, enriched data, and metadata.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      itemId: z.string().describe("The unique identifier of the Item")
    },
    async ({ websetId, itemId }) => {
      const requestId = `get_webset_item_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webset_item_exa');
      
      logger.start(`Getting item ${itemId} from Webset ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_ITEM_BY_ID
          .replace(':websetId', websetId)
          .replace(':itemId', itemId);
        
        const response = await axiosInstance.get<WebsetItem>(url);
        
        logger.log('Retrieved item successfully');
        
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
              text: `Get item error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Get item error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Delete Webset Item Tool
  server.tool(
    "delete_webset_item_exa",
    "Delete a specific item from a Webset. This permanently removes the item and all its associated data.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      itemId: z.string().describe("The unique identifier of the Item to delete")
    },
    async ({ websetId, itemId }) => {
      const requestId = `delete_webset_item_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_webset_item_exa');
      
      logger.start(`Deleting item ${itemId} from Webset ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_ITEM_BY_ID
          .replace(':websetId', websetId)
          .replace(':itemId', itemId);
        
        await axiosInstance.delete(url);
        
        logger.log('Item deleted successfully');
        
        const result = {
          content: [{
            type: "text" as const,
            text: `Item ${itemId} has been successfully deleted from Webset ${websetId}.`
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
              text: `Delete item error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Delete item error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Search Webset Items Tool (client-side filtering)
  server.tool(
    "search_webset_items_exa",
    "Search and filter items within a Webset based on various criteria. This tool retrieves all items and filters them locally.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      filters: z.object({
        type: z.string().optional().describe("Filter by item type (e.g., 'company', 'person', 'article')"),
        verificationStatus: z.enum(['verified', 'pending', 'failed']).optional().describe("Filter by verification status"),
        hasEnrichedData: z.boolean().optional().describe("Filter items that have enriched data"),
        urlPattern: z.string().optional().describe("Filter by URL pattern (regex)"),
        titlePattern: z.string().optional().describe("Filter by title pattern (regex)")
      }).optional().describe("Filtering criteria")
    },
    async ({ websetId, filters }) => {
      const requestId = `search_webset_items_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'search_webset_items_exa');
      
      logger.start(`Searching items in Webset: ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        // Fetch all items (paginated)
        let allItems: WebsetItem[] = [];
        let cursor: string | null = null;
        let hasMore = true;
        
        while (hasMore) {
          const params = new URLSearchParams();
          if (cursor) params.append('cursor', cursor);
          params.append('limit', '100'); // Max per page
          
          const url = API_CONFIG.ENDPOINTS.WEBSET_ITEMS.replace(':websetId', websetId);
          const response = await axiosInstance.get<PaginatedWebsetItemList>(url, { params });
          
          allItems = allItems.concat(response.data.data);
          hasMore = response.data.hasMore;
          cursor = response.data.nextCursor || null;
          
          logger.log(`Fetched ${response.data.data.length} items, total: ${allItems.length}`);
        }
        
        // Apply filters
        let filteredItems = allItems;
        
        if (filters) {
          if (filters.type) {
            filteredItems = filteredItems.filter(item => item.type === filters.type);
          }
          
          if (filters.verificationStatus) {
            filteredItems = filteredItems.filter(item => 
              item.verification?.status === filters.verificationStatus
            );
          }
          
          if (filters.hasEnrichedData !== undefined) {
            filteredItems = filteredItems.filter(item => {
              const hasData = item.enrichedData && Object.keys(item.enrichedData).length > 0;
              return filters.hasEnrichedData ? hasData : !hasData;
            });
          }
          
          if (filters.urlPattern) {
            const urlRegex = new RegExp(filters.urlPattern, 'i');
            filteredItems = filteredItems.filter(item => urlRegex.test(item.url));
          }
          
          if (filters.titlePattern) {
            const titleRegex = new RegExp(filters.titlePattern, 'i');
            filteredItems = filteredItems.filter(item => 
              item.title && titleRegex.test(item.title)
            );
          }
        }
        
        logger.log(`Filtered to ${filteredItems.length} items from ${allItems.length} total`);
        
        const formattedResult = {
          websetId: websetId,
          totalItems: allItems.length,
          matchingItems: filteredItems.length,
          filters: filters,
          items: filteredItems.map(item => ({
            id: item.id,
            url: item.url,
            title: item.title,
            type: item.type,
            verification: item.verification,
            enrichedData: item.enrichedData,
            metadata: item.metadata,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
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
              text: `Search items error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Search items error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}