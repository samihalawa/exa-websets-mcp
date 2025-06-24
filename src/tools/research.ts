import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ExaResearchRequest, ExaResearchResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerResearchTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "deep_research_exa",
    "Conduct comprehensive research on any topic with structured output. Performs deep web analysis, synthesizes information from multiple sources, and generates detailed reports or structured data. Supports custom output schemas for specific research needs.",
    {
      query: z.string().describe("The research topic or question to investigate"),
      report: z.boolean().optional().describe("Generate a comprehensive markdown research report (default: true)"),
      numResults: z.number().optional().describe("Number of sources to analyze (default: 10, max: 50 for deep research)"),
      outputSchema: z.record(z.any()).optional().describe("Custom JSON schema for structured data extraction (e.g., for extracting specific fields)"),
      llmGenerateSchema: z.boolean().optional().describe("Let AI auto-generate an appropriate schema based on the query (default: false)"),
      includeDomains: z.array(z.string()).optional().describe("Focus research on these domains"),
      excludeDomains: z.array(z.string()).optional().describe("Exclude these domains from research"),
      category: z.enum(['company', 'research paper', 'news', 'pdf', 'github', 'tweet', 'personal site', 'linkedin profile', 'financial report']).optional().describe("Focus on specific content types"),
      startPublishedDate: z.string().optional().describe("Only analyze content published after this date (ISO 8601 format)"),
      endPublishedDate: z.string().optional().describe("Only analyze content published before this date (ISO 8601 format)")
    },
    async (args) => {
      const requestId = `deep_research_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'deep_research_exa');
      
      logger.start(args.query);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: API_CONFIG.REQUEST_TIMEOUT * 4 // 4x timeout for research tasks
        });

        // Build the research request
        const researchRequest: ExaResearchRequest = {
          query: args.query,
          report: args.report !== false, // Default to true
          numResults: args.numResults || 10,
          ...(args.outputSchema && { outputSchema: args.outputSchema }),
          ...(args.llmGenerateSchema !== undefined && { llmGenerateSchema: args.llmGenerateSchema }),
          ...(args.includeDomains && { includeDomains: args.includeDomains }),
          ...(args.excludeDomains && { excludeDomains: args.excludeDomains }),
          ...(args.category && { category: args.category }),
          ...(args.startPublishedDate && { startPublishedDate: args.startPublishedDate }),
          ...(args.endPublishedDate && { endPublishedDate: args.endPublishedDate })
        };
        
        logger.log(`Initiating deep research with ${researchRequest.numResults} sources`);
        
        // Start the research task
        const taskResponse = await axiosInstance.post<ExaResearchResponse>(
          API_CONFIG.ENDPOINTS.RESEARCH,
          researchRequest
        );
        
        if (!taskResponse.data || !taskResponse.data.taskId) {
          throw new Error("Failed to start research task - no task ID received");
        }

        const taskId = taskResponse.data.taskId;
        logger.log(`Research task started with ID: ${taskId}`);

        // Poll for task completion
        const maxPollingTime = 120000; // 2 minutes max
        const pollingInterval = 3000; // 3 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxPollingTime) {
          await new Promise(resolve => setTimeout(resolve, pollingInterval));
          
          // Check task status
          const statusUrl = API_CONFIG.ENDPOINTS.RESEARCH_STATUS.replace(':taskId', taskId);
          const statusResponse = await axiosInstance.get<ExaResearchResponse>(statusUrl);
          
          logger.log(`Task status: ${statusResponse.data.status}`);
          
          if (statusResponse.data.status === 'completed') {
            // Task completed successfully
            if (!statusResponse.data.result) {
              throw new Error("Research completed but no results returned");
            }

            // Format the response
            const formattedResults: any = {
              requestId: statusResponse.data.requestId,
              taskId: taskId,
              researchTopic: args.query,
              status: 'completed'
            };

            // Handle different output formats
            if (statusResponse.data.result.report) {
              // Report format - return as markdown
              formattedResults.reportGenerated = true;
              
              const result = {
                content: [{
                  type: "text" as const,
                  text: `# Research Report: ${args.query}\n\n${statusResponse.data.result.report}\n\n---\n*Research ID: ${taskId}*`
                }]
              };
              
              logger.complete();
              return result;
            } else if (statusResponse.data.result.data) {
              // Structured data format
              formattedResults.structuredData = statusResponse.data.result.data;
              formattedResults.schemaUsed = !!args.outputSchema || args.llmGenerateSchema;
              
              const result = {
                content: [{
                  type: "text" as const,
                  text: JSON.stringify(formattedResults, null, 2)
                }]
              };
              
              logger.complete();
              return result;
            } else {
              throw new Error("Research completed but results are in unexpected format");
            }
          } else if (statusResponse.data.status === 'failed') {
            throw new Error(statusResponse.data.error || "Research task failed");
          }
          
          // Task still processing
        }
        
        // Timeout reached
        logger.log("Research task timed out");
        return {
          content: [{
            type: "text" as const,
            text: `Research task is still processing. Task ID: ${taskId}\n\nThe research is taking longer than expected. You can check the status later using the task ID.`
          }]
        };
        
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.message || error.message;
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          return {
            content: [{
              type: "text" as const,
              text: `Research error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Research error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );

  // Also register a tool to check research task status
  server.tool(
    "check_research_status_exa",
    "Check the status of a previously initiated research task using its task ID.",
    {
      taskId: z.string().describe("The task ID returned from deep_research_exa")
    },
    async ({ taskId }) => {
      const requestId = `check_research_status_exa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'check_research_status_exa');
      
      logger.start(`Checking status for task: ${taskId}`);
      
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

        const statusUrl = API_CONFIG.ENDPOINTS.RESEARCH_STATUS.replace(':taskId', taskId);
        const response = await axiosInstance.get<ExaResearchResponse>(statusUrl);
        
        logger.log(`Task status: ${response.data.status}`);

        if (response.data.status === 'completed' && response.data.result) {
          if (response.data.result.report) {
            return {
              content: [{
                type: "text" as const,
                text: `# Research Report (Task: ${taskId})\n\n${response.data.result.report}`
              }]
            };
          } else if (response.data.result.data) {
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  taskId: taskId,
                  status: 'completed',
                  data: response.data.result.data
                }, null, 2)
              }]
            };
          }
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              taskId: taskId,
              status: response.data.status,
              error: response.data.error
            }, null, 2)
          }]
        };
        
      } catch (error) {
        logger.error(error);
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.message || error.message;
          
          return {
            content: [{
              type: "text" as const,
              text: `Status check error (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Status check error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}