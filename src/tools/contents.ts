import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ExaContentsRequest, ExaContentsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerContentsTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_contents_exa",
    "Retrieve full content from specific URLs with advanced extraction options. Supports batch processing, live crawling for real-time data, subpage extraction, and various content formats including text, highlights, and AI-generated summaries.",
    {
      urls: z.array(z.string()).describe("List of URLs to fetch content from (max 10 URLs per request)"),
      text: z.union([
        z.boolean(),
        z.object({
          maxCharacters: z.number().optional().describe("Maximum characters to extract (default: 3000)"),
          includeHtmlTags: z.boolean().optional().describe("Include HTML tags in extracted text")
        })
      ]).optional().describe("Extract full text content from pages"),
      highlights: z.union([
        z.boolean(),
        z.object({
          numSentences: z.number().optional().describe("Number of highlight sentences (default: 3)"),
          highlightsPerUrl: z.number().optional().describe("Number of highlights per URL"),
          query: z.string().optional().describe("Query to guide highlight extraction")
        })
      ]).optional().describe("Extract key sentences as highlights"),
      summary: z.union([
        z.boolean(),
        z.object({
          query: z.string().optional().describe("Query to guide summary generation")
        })
      ]).optional().describe("Generate AI summaries of content"),
      livecrawl: z.enum(['always', 'fallback', 'never']).optional().describe("Live crawling behavior - always: force fresh crawl, fallback: use cache first, never: cache only (default: fallback)"),
      subpages: z.object({
        max: z.number().optional().describe("Maximum subpages to crawl per URL (default: 0)"),
        includePatterns: z.array(z.string()).optional().describe("URL patterns to include (e.g., 'blog/*', '*/about')"),
        excludePatterns: z.array(z.string()).optional().describe("URL patterns to exclude")
      }).optional().describe("Crawl and extract content from linked pages"),
      extras: z.object({
        links: z.boolean().optional().describe("Extract all links from the page"),
        imageLinks: z.boolean().optional().describe("Extract all image links from the page")
      }).optional().describe("Additional metadata extraction")
    },
    async (args) => {
      const requestId = `get_contents_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_contents_exa');
      
      logger.start(`Fetching content from ${args.urls.length} URLs`);
      
      try {
        // Validate URL count
        if (args.urls.length > 10) {
          return {
            content: [{
              type: "text" as const,
              text: "Error: Maximum 10 URLs allowed per request. Please split your request into smaller batches."
            }],
            isError: true
          };
        }

        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT * 2 // Double timeout for content fetching
        });

        // Build the contents request
        const contentsRequest: ExaContentsRequest = {
          urls: args.urls
        };

        // Handle text extraction
        if (args.text !== undefined) {
          if (typeof args.text === 'boolean') {
            contentsRequest.text = args.text;
          } else {
            contentsRequest.text = {
              maxCharacters: args.text.maxCharacters || API_CONFIG.DEFAULT_MAX_CHARACTERS,
              ...(args.text.includeHtmlTags !== undefined && { includeHtmlTags: args.text.includeHtmlTags })
            };
          }
        } else {
          // Default: include text
          contentsRequest.text = { maxCharacters: API_CONFIG.DEFAULT_MAX_CHARACTERS };
        }

        // Handle highlights
        if (args.highlights !== undefined) {
          if (typeof args.highlights === 'boolean') {
            contentsRequest.highlights = args.highlights;
          } else {
            contentsRequest.highlights = {
              numSentences: args.highlights.numSentences || API_CONFIG.DEFAULT_HIGHLIGHTS_SENTENCES,
              ...(args.highlights.highlightsPerUrl && { highlightsPerUrl: args.highlights.highlightsPerUrl }),
              ...(args.highlights.query && { query: args.highlights.query })
            };
          }
        }

        // Handle summary
        if (args.summary !== undefined) {
          if (typeof args.summary === 'boolean') {
            contentsRequest.summary = args.summary;
          } else {
            contentsRequest.summary = {
              ...(args.summary.query && { query: args.summary.query })
            };
          }
        }

        // Handle livecrawl
        contentsRequest.livecrawl = args.livecrawl || 'fallback';

        // Handle subpages
        if (args.subpages) {
          contentsRequest.subpages = {
            max: args.subpages.max || 0,
            ...(args.subpages.includePatterns && { includePatterns: args.subpages.includePatterns }),
            ...(args.subpages.excludePatterns && { excludePatterns: args.subpages.excludePatterns })
          };
        }

        // Handle extras
        if (args.extras) {
          contentsRequest.extras = {
            ...(args.extras.links !== undefined && { links: args.extras.links }),
            ...(args.extras.imageLinks !== undefined && { imageLinks: args.extras.imageLinks })
          };
        }
        
        logger.log(`Sending contents request with livecrawl: ${contentsRequest.livecrawl}`);
        
        const response = await axiosInstance.post<ExaContentsResponse>(
          API_CONFIG.ENDPOINTS.CONTENTS,
          contentsRequest
        );
        
        logger.log(`Received content for ${response.data.results?.length || 0} URLs`);

        if (!response.data || !response.data.results) {
          logger.log("Warning: Empty or invalid response");
          return {
            content: [{
              type: "text" as const,
              text: "No content retrieved. The URLs may be inaccessible or blocked."
            }]
          };
        }

        // Format the response for better readability
        const formattedResults = {
          requestId: response.data.requestId,
          urlsProcessed: response.data.results.length,
          results: response.data.results.map((result, index) => ({
            index: index + 1,
            url: result.url,
            title: result.title,
            status: result.status || 'success',
            ...(result.error && { error: result.error }),
            ...(result.author && { author: result.author }),
            ...(result.publishedDate && { publishedDate: result.publishedDate }),
            ...(result.text && { 
              text: result.text,
              textLength: result.text.length 
            }),
            ...(result.highlights && { highlights: result.highlights }),
            ...(result.summary && { summary: result.summary }),
            ...(result.links && { linksCount: result.links.length }),
            ...(result.imageLinks && { imageLinksCount: result.imageLinks.length })
          }))
        };

        // Add status summary if available
        if (response.data.statuses) {
          const successCount = response.data.statuses.filter(s => s.status === 'success').length;
          const errorCount = response.data.statuses.filter(s => s.status === 'error').length;
          (formattedResults as any).statusSummary = {
            success: successCount,
            errors: errorCount,
            errorDetails: response.data.statuses
              .filter(s => s.status === 'error')
              .map(s => ({ url: s.url, error: s.error }))
          };
        }
        
        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(formattedResults, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.message || error.message;
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          return {
            content: [{
              type: "text" as const,
              text: `Content retrieval error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Content retrieval error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}