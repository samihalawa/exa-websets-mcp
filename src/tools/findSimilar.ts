import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ExaFindSimilarRequest, ExaSearchResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerFindSimilarTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "find_similar_exa",
    "Find pages semantically similar to a given URL. Perfect for competitor analysis, finding related research papers, discovering alternative sources, or building content recommendation systems.",
    {
      url: z.string().describe("The reference URL to find similar pages for"),
      numResults: z.number().optional().describe("Number of similar results to return (default: 5, max: 100)"),
      includeDomains: z.array(z.string()).optional().describe("Only include results from these domains"),
      excludeDomains: z.array(z.string()).optional().describe("Exclude results from these domains"),
      excludeSourceDomain: z.boolean().optional().describe("Exclude results from the same domain as the reference URL (default: false)"),
      category: z.enum(['company', 'research paper', 'news', 'pdf', 'github', 'tweet', 'personal site', 'linkedin profile', 'financial report']).optional().describe("Filter similar results by content type"),
      startPublishedDate: z.string().optional().describe("Filter by publication date (ISO 8601 format)"),
      endPublishedDate: z.string().optional().describe("End date for publication filter (ISO 8601 format)"),
      startCrawlDate: z.string().optional().describe("Filter by when page was crawled (ISO 8601 format)"),
      endCrawlDate: z.string().optional().describe("End date for crawl filter (ISO 8601 format)"),
      contents: z.object({
        text: z.union([
          z.boolean(),
          z.object({
            maxCharacters: z.number().optional().describe("Maximum characters to return per result (default: 3000)"),
            includeHtmlTags: z.boolean().optional().describe("Include HTML tags in text content")
          })
        ]).optional().describe("Extract full text content from similar pages"),
        highlights: z.union([
          z.boolean(),
          z.object({
            numSentences: z.number().optional().describe("Number of highlight sentences (default: 3)"),
            highlightsPerUrl: z.number().optional().describe("Number of highlights per URL"),
            query: z.string().optional().describe("Custom query for highlights")
          })
        ]).optional().describe("Extract relevant text snippets"),
        summary: z.union([
          z.boolean(),
          z.object({
            query: z.string().optional().describe("Custom query for summary generation")
          })
        ]).optional().describe("Generate AI summaries of content"),
        livecrawl: z.enum(['always', 'fallback', 'preferred', 'never']).optional().describe("Live crawling behavior (default: preferred)"),
        subpages: z.object({
          max: z.number().optional().describe("Maximum subpages to crawl (default: 0)"),
          includePatterns: z.array(z.string()).optional().describe("URL patterns to include when crawling subpages"),
          excludePatterns: z.array(z.string()).optional().describe("URL patterns to exclude when crawling subpages")
        }).optional().describe("Crawl and include subpages"),
        extras: z.object({
          links: z.boolean().optional().describe("Extract all links from the page"),
          imageLinks: z.boolean().optional().describe("Extract all image links from the page")
        }).optional().describe("Additional metadata to extract")
      }).optional().describe("Content extraction options for similar pages")
    },
    async (args) => {
      const requestId = `find_similar_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'find_similar_exa');
      
      logger.start(`Finding pages similar to: ${args.url}`);
      
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

        // Build the find similar request
        const findSimilarRequest: ExaFindSimilarRequest = {
          url: args.url,
          numResults: args.numResults || API_CONFIG.DEFAULT_NUM_RESULTS,
          ...(args.includeDomains && { includeDomains: args.includeDomains }),
          ...(args.excludeDomains && { excludeDomains: args.excludeDomains }),
          ...(args.excludeSourceDomain !== undefined && { excludeSourceDomain: args.excludeSourceDomain }),
          ...(args.category && { category: args.category }),
          ...(args.startPublishedDate && { startPublishedDate: args.startPublishedDate }),
          ...(args.endPublishedDate && { endPublishedDate: args.endPublishedDate }),
          ...(args.startCrawlDate && { startCrawlDate: args.startCrawlDate }),
          ...(args.endCrawlDate && { endCrawlDate: args.endCrawlDate })
        };

        // Build content options if provided
        if (args.contents) {
          const contentOptions: any = {};
          
          // Handle text extraction
          if (args.contents.text !== undefined) {
            if (typeof args.contents.text === 'boolean') {
              contentOptions.text = args.contents.text;
            } else {
              contentOptions.text = {
                maxCharacters: args.contents.text.maxCharacters || API_CONFIG.DEFAULT_MAX_CHARACTERS,
                ...(args.contents.text.includeHtmlTags !== undefined && { includeHtmlTags: args.contents.text.includeHtmlTags })
              };
            }
          } else {
            // Default: include text
            contentOptions.text = { maxCharacters: API_CONFIG.DEFAULT_MAX_CHARACTERS };
          }
          
          // Handle highlights
          if (args.contents.highlights !== undefined) {
            if (typeof args.contents.highlights === 'boolean') {
              contentOptions.highlights = args.contents.highlights;
            } else {
              contentOptions.highlights = {
                numSentences: args.contents.highlights.numSentences || API_CONFIG.DEFAULT_HIGHLIGHTS_SENTENCES,
                ...(args.contents.highlights.highlightsPerUrl && { highlightsPerUrl: args.contents.highlights.highlightsPerUrl }),
                ...(args.contents.highlights.query && { query: args.contents.highlights.query })
              };
            }
          }
          
          // Handle summary
          if (args.contents.summary !== undefined) {
            if (typeof args.contents.summary === 'boolean') {
              contentOptions.summary = args.contents.summary;
            } else {
              contentOptions.summary = {
                ...(args.contents.summary.query && { query: args.contents.summary.query })
              };
            }
          }
          
          // Handle livecrawl
          contentOptions.livecrawl = args.contents.livecrawl || 'preferred';
          
          // Handle subpages
          if (args.contents.subpages) {
            contentOptions.subpages = {
              max: args.contents.subpages.max || 0,
              ...(args.contents.subpages.includePatterns && { includePatterns: args.contents.subpages.includePatterns }),
              ...(args.contents.subpages.excludePatterns && { excludePatterns: args.contents.subpages.excludePatterns })
            };
          }
          
          // Handle extras
          if (args.contents.extras) {
            contentOptions.extras = {
              ...(args.contents.extras.links !== undefined && { links: args.contents.extras.links }),
              ...(args.contents.extras.imageLinks !== undefined && { imageLinks: args.contents.extras.imageLinks })
            };
          }
          
          findSimilarRequest.contents = contentOptions;
        } else {
          // Default content options
          findSimilarRequest.contents = {
            text: { maxCharacters: API_CONFIG.DEFAULT_MAX_CHARACTERS },
            livecrawl: 'preferred'
          };
        }
        
        logger.log(`Sending find similar request with ${Object.keys(findSimilarRequest).length} parameters`);
        
        const response = await axiosInstance.post<ExaSearchResponse>(
          API_CONFIG.ENDPOINTS.FIND_SIMILAR,
          findSimilarRequest
        );
        
        logger.log(`Found ${response.data.results?.length || 0} similar pages`);

        if (!response.data || !response.data.results) {
          logger.log("Warning: Empty or invalid response");
          return {
            content: [{
              type: "text" as const,
              text: "No similar pages found. The URL may be inaccessible or have no similar content in the index."
            }]
          };
        }

        // Extract domain from reference URL for analysis
        let referenceDomain = '';
        try {
          const urlObj = new URL(args.url);
          referenceDomain = urlObj.hostname;
        } catch (e) {
          logger.log("Could not parse reference URL");
        }

        // Format the response for better readability
        const formattedResults = {
          requestId: response.data.requestId,
          referenceUrl: args.url,
          referenceDomain: referenceDomain,
          similarPagesFound: response.data.results.length,
          results: response.data.results.map((result, index) => {
            let resultDomain = '';
            try {
              const urlObj = new URL(result.url);
              resultDomain = urlObj.hostname;
            } catch (e) {
              // Ignore URL parsing errors
            }

            return {
              index: index + 1,
              title: result.title,
              url: result.url,
              domain: resultDomain,
              sameDomain: resultDomain === referenceDomain,
              publishedDate: result.publishedDate,
              author: result.author,
              score: result.score,
              ...(result.text && { text: result.text }),
              ...(result.highlights && { highlights: result.highlights }),
              ...(result.summary && { summary: result.summary }),
              ...(result.links && { linksCount: result.links.length }),
              ...(result.imageLinks && { imageLinksCount: result.imageLinks.length })
            };
          })
        };

        // Add domain diversity analysis
        const uniqueDomains = new Set(formattedResults.results.map(r => r.domain).filter(d => d));
        (formattedResults as any).domainDiversity = {
          uniqueDomains: uniqueDomains.size,
          domains: Array.from(uniqueDomains)
        };
        
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
              text: `Find similar error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Find similar error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}