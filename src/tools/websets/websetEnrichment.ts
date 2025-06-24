import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "../config.js";
import { WebsetEnrichment, WebsetEnrichmentInput } from "../../types.js";
import { createRequestLogger } from "../../utils/logger.js";

export function registerWebsetEnrichmentTools(server: McpServer, config?: { exaApiKey?: string }): void {
  // Create Webset Enrichment Tool
  server.tool(
    "create_webset_enrichment_exa",
    "Create an enrichment task for a Webset. Enrichments extract specific data from found items using AI. You can define the data format and provide extraction instructions.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      description: z.string().describe("Description of the data to extract (e.g., 'Find the CEO name and email for each company')"),
      format: z.enum(['text', 'date', 'number', 'options', 'email', 'phone']).optional().describe("Expected format of the extracted data (auto-detected if not provided)"),
      options: z.array(z.object({
        label: z.string().describe("Option label")
      })).optional().describe("Predefined options (required only if format is 'options')"),
      metadata: z.record(z.string()).optional().describe("Key-value metadata for the enrichment")
    },
    async ({ websetId, ...enrichmentData }) => {
      const requestId = `create_webset_enrichment_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_webset_enrichment_exa');
      
      logger.start(`Creating enrichment for Webset: ${websetId}`);
      
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

        const requestBody: WebsetEnrichmentInput = {
          description: enrichmentData.description,
          ...(enrichmentData.format && { format: enrichmentData.format }),
          ...(enrichmentData.options && { options: enrichmentData.options }),
          ...(enrichmentData.metadata && { metadata: enrichmentData.metadata })
        };
        
        // Validate options requirement
        if (enrichmentData.format === 'options' && !enrichmentData.options) {
          return {
            content: [{
              type: "text" as const,
              text: "Error: 'options' format requires providing option labels"
            }],
            isError: true
          };
        }
        
        logger.log(`Creating enrichment: "${requestBody.description}"`);
        
        const url = API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENTS.replace(':websetId', websetId);
        const response = await axiosInstance.post<WebsetEnrichment>(url, requestBody);
        
        logger.log(`Enrichment created with ID: ${response.data.id}`);
        
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
              text: `Create enrichment error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Create enrichment error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Get Webset Enrichment Tool
  server.tool(
    "get_webset_enrichment_exa",
    "Get details of a specific enrichment task including its status, format, and auto-generated instructions.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      enrichmentId: z.string().describe("The unique identifier of the Enrichment")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `get_webset_enrichment_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webset_enrichment_exa');
      
      logger.start(`Getting enrichment ${enrichmentId} from Webset ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_BY_ID
          .replace(':websetId', websetId)
          .replace(':enrichmentId', enrichmentId);
        
        const response = await axiosInstance.get<WebsetEnrichment>(url);
        
        logger.log(`Retrieved enrichment with status: ${response.data.status}`);
        
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
              text: `Get enrichment error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Get enrichment error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // List Webset Enrichments Tool
  server.tool(
    "list_webset_enrichments_exa",
    "List all enrichment tasks for a specific Webset including their status and descriptions.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      cursor: z.string().optional().describe("Pagination cursor from previous response"),
      limit: z.number().optional().describe("Number of results per page (default: 25, max: 200)")
    },
    async ({ websetId, cursor, limit }) => {
      const requestId = `list_webset_enrichments_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_webset_enrichments_exa');
      
      logger.start(`Listing enrichments for Webset: ${websetId}`);
      
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
        
        const url = API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENTS.replace(':websetId', websetId);
        const response = await axiosInstance.get(url, { params });
        
        // Note: The response structure might be an array or paginated list
        const enrichments = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        logger.log(`Retrieved ${enrichments.length} enrichments`);
        
        const formattedResult = {
          websetId: websetId,
          enrichmentCount: enrichments.length,
          enrichments: enrichments.map((enrichment: WebsetEnrichment) => ({
            id: enrichment.id,
            status: enrichment.status,
            title: enrichment.title,
            description: enrichment.description,
            format: enrichment.format,
            createdAt: enrichment.createdAt
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
              text: `List enrichments error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `List enrichments error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Delete Webset Enrichment Tool
  server.tool(
    "delete_webset_enrichment_exa",
    "Delete a specific enrichment task from a Webset. This removes the enrichment definition but keeps any data already extracted.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      enrichmentId: z.string().describe("The unique identifier of the Enrichment to delete")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `delete_webset_enrichment_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_webset_enrichment_exa');
      
      logger.start(`Deleting enrichment ${enrichmentId} from Webset ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT
        });

        const url = API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_BY_ID
          .replace(':websetId', websetId)
          .replace(':enrichmentId', enrichmentId);
        
        await axiosInstance.delete(url);
        
        logger.log('Enrichment deleted successfully');
        
        const result = {
          content: [{
            type: "text" as const,
            text: `Enrichment ${enrichmentId} has been successfully deleted from Webset ${websetId}.`
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
              text: `Delete enrichment error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Delete enrichment error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Cancel Webset Enrichment Tool
  server.tool(
    "cancel_webset_enrichment_exa",
    "Cancel a running enrichment task. This stops the enrichment process but keeps any data already extracted.",
    {
      websetId: z.string().describe("The unique identifier of the Webset"),
      enrichmentId: z.string().describe("The unique identifier of the Enrichment to cancel")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `cancel_webset_enrichment_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'cancel_webset_enrichment_exa');
      
      logger.start(`Canceling enrichment ${enrichmentId} in Webset ${websetId}`);
      
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

        const url = API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_CANCEL
          .replace(':websetId', websetId)
          .replace(':enrichmentId', enrichmentId);
        
        const response = await axiosInstance.post<WebsetEnrichment>(url);
        
        logger.log('Enrichment canceled successfully');
        
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
              text: `Cancel enrichment error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Cancel enrichment error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}