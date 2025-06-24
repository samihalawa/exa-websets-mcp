import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ExaAnswerRequest, ExaAnswerResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerAnswerTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "answer_with_citations_exa",
    "Generate direct answers to questions with citations from web sources. Uses Exa's AI to search the web, analyze content, and provide accurate answers backed by reliable sources. Perfect for fact-checking, research questions, and real-time information retrieval.",
    {
      query: z.string().describe("The question to answer - can be in natural language"),
      text: z.boolean().optional().describe("Include full source text in addition to answer (default: false)"),
      stream: z.boolean().optional().describe("Enable streaming response for real-time updates (default: false)"),
      numResults: z.number().optional().describe("Number of sources to search and analyze (default: 5, max: 20)"),
      includeDomains: z.array(z.string()).optional().describe("Only search within these domains for answers"),
      excludeDomains: z.array(z.string()).optional().describe("Exclude these domains from search"),
      category: z.enum(['company', 'research paper', 'news', 'pdf', 'github', 'tweet', 'personal site', 'linkedin profile', 'financial report']).optional().describe("Filter sources by content type"),
      startPublishedDate: z.string().optional().describe("Only use sources published after this date (ISO 8601 format)"),
      endPublishedDate: z.string().optional().describe("Only use sources published before this date (ISO 8601 format)"),
      startCrawlDate: z.string().optional().describe("Only use sources crawled after this date (ISO 8601 format)"),
      endCrawlDate: z.string().optional().describe("Only use sources crawled before this date (ISO 8601 format)"),
      includeText: z.string().optional().describe("Only use sources containing this text"),
      excludeText: z.string().optional().describe("Exclude sources containing this text")
    },
    async (args) => {
      const requestId = `answer_with_citations_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'answer_with_citations_exa');
      
      logger.start(args.query);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT * 2 // Double timeout for answer generation
        });

        // Build the answer request
        const answerRequest: ExaAnswerRequest = {
          query: args.query,
          text: args.text || false,
          stream: args.stream || false,
          numResults: args.numResults || API_CONFIG.DEFAULT_NUM_RESULTS,
          ...(args.includeDomains && { includeDomains: args.includeDomains }),
          ...(args.excludeDomains && { excludeDomains: args.excludeDomains }),
          ...(args.category && { category: args.category }),
          ...(args.startPublishedDate && { startPublishedDate: args.startPublishedDate }),
          ...(args.endPublishedDate && { endPublishedDate: args.endPublishedDate }),
          ...(args.startCrawlDate && { startCrawlDate: args.startCrawlDate }),
          ...(args.endCrawlDate && { endCrawlDate: args.endCrawlDate }),
          ...(args.includeText && { includeText: args.includeText }),
          ...(args.excludeText && { excludeText: args.excludeText })
        };
        
        logger.log(`Sending answer request with ${Object.keys(answerRequest).length} parameters`);
        
        const response = await axiosInstance.post<ExaAnswerResponse>(
          API_CONFIG.ENDPOINTS.ANSWER,
          answerRequest
        );
        
        logger.log(`Generated answer with ${response.data.citations?.length || 0} citations`);

        if (!response.data || !response.data.answer) {
          logger.log("Warning: Empty or invalid response");
          return {
            content: [{
              type: "text" as const,
              text: "Could not generate an answer. Please try rephrasing your question or adjusting the search parameters."
            }]
          };
        }

        // Format the response for better readability
        const formattedResults = {
          requestId: response.data.requestId,
          question: args.query,
          answer: response.data.answer,
          citationsCount: response.data.citations?.length || 0,
          citations: response.data.citations?.map((citation, index) => ({
            index: index + 1,
            title: citation.title,
            url: citation.url,
            snippet: citation.snippet
          })) || []
        };

        // Add domain analysis for citations
        if (formattedResults.citations.length > 0) {
          const citationDomains = formattedResults.citations.map(c => {
            try {
              return new URL(c.url).hostname;
            } catch (e) {
              return 'unknown';
            }
          });
          const uniqueDomains = new Set(citationDomains);
          (formattedResults as any).sourceAnalysis = {
            uniqueSources: uniqueDomains.size,
            sources: Array.from(uniqueDomains)
          };
        }

        // Create a more readable text format
        let readableOutput = `# Answer\n\n${formattedResults.answer}\n\n`;
        readableOutput += `## Sources (${formattedResults.citationsCount})\n\n`;
        
        formattedResults.citations.forEach((citation) => {
          readableOutput += `${citation.index}. **${citation.title}**\n`;
          readableOutput += `   URL: ${citation.url}\n`;
          readableOutput += `   Snippet: "${citation.snippet}"\n\n`;
        });

        if ((formattedResults as any).sourceAnalysis) {
          readableOutput += `## Source Analysis\n`;
          readableOutput += `- Unique sources: ${(formattedResults as any).sourceAnalysis.uniqueSources}\n`;
          readableOutput += `- Domains: ${(formattedResults as any).sourceAnalysis.sources.join(', ')}\n`;
        }
        
        const result = {
          content: [{
            type: "text" as const,
            text: readableOutput
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
              text: `Answer generation error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Answer generation error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}