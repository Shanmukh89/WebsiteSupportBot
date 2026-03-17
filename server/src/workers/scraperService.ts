import { spawn } from 'child_process';
import path from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from '../utils/config';
import { supabaseAdmin } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openai.apiKey,
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
});

export async function runScrapeJob(agentId: string, url: string) {
    console.log(`Starting deep scrape job for Agent: ${agentId}, URL: ${url}`);

    try {
        // 0. Set agent status to scraping
        await supabaseAdmin.from('agents').update({ status: 'scraping' }).eq('id', agentId);

        // 1. Run the Sequential Python script
        console.log(`Spidering ${url} with custom sequential scraper... this may take some time.`);
        
        // When running via ts-node or compiled dist, the path might vary. Let's use process.cwd() as a safer anchor.
        const scriptPath = path.resolve(process.cwd(), 'scripts/crawl4ai_service.py');
        const pythonExecutable = path.resolve(process.cwd(), 'venv/Scripts/python.exe');
        
        console.log(`Using Python: ${pythonExecutable}`);
        console.log(`Using Script: ${scriptPath}`);
        
        const crawlResult = await new Promise<any>((resolve, reject) => {
            const pythonProcess = spawn(pythonExecutable, [scriptPath, url]);
            
            let stdoutData = '';
            let stderrData = '';
            
            pythonProcess.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
                // Muted stderr logs to avoid console spam 
            });
            
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Crawler script exited with code ${code}`));
                    return;
                }
                
                try {
                    const output = stdoutData.trim();
                    
                    // Attempt to extract JSON if it's mixed with other text
                    let jsonStr = output;
                    const jsonStart = output.indexOf('{');
                    const jsonEnd = output.lastIndexOf('}');
                    
                    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                        jsonStr = output.substring(jsonStart, jsonEnd + 1);
                    }
                    
                    const result = JSON.parse(jsonStr);
                    if (result.error) {
                        reject(new Error(result.error));
                    } else {
                        resolve(result);
                    }
                } catch (e: any) {
                    reject(new Error(`Failed to parse crawler output: ${e.message}`));
                }
            });
        });

        const pages = crawlResult.pages || [];
        console.log(`Deep crawl complete. Discovered and scraped ${pages.length} pages.`);

        if (pages.length === 0) {
            throw new Error('No pages were successfully scraped');
        }

        // 2. Process each page: Create sources and ONE chunk per product
        const chunksToInsert = [];

        for (const page of pages) {
            const rawText = page.content;
            if (!rawText) continue;
            
            // Create a dedicated knowledge source for this specific page
            const sourceId = uuidv4();
            const { error: srcErr } = await supabaseAdmin.from('knowledge_sources').insert([{
                id: sourceId,
                agent_id: agentId,
                source_type: 'website',
                title: page.title || new URL(page.url).pathname || 'Website Page',
                url: page.url,
                status: 'processing'
            }]);
            
            if (srcErr) {
                console.error(`Failed to insert knowledge_source for ${page.url}:`, srcErr.message);
                continue; // Skip chunks insertion if source fails
            }
            
            // For a product, we want exactly ONE chunk rather than arbitrary character splits
            // The content should summarize Name, Price, Description, URL
            const chunkContent = `Product Name: ${page.title}\nURL: ${page.url}\nDescription/Content: ${rawText}`;
            console.log(`  - ${page.url}: assigned 1 product chunk.`);

            // 3. Generate Embedding & Prepare for DB 
            const allVectors = await embeddings.embedDocuments([chunkContent]);
            
            chunksToInsert.push({
                source_id: sourceId,
                agent_id: agentId,  // EXPLICIT AGENT ID ISOLATION FOR BUG 2
                content: chunkContent,
                chunk_index: 0,
                embedding: allVectors[0],
                metadata: {
                    title: page.title,
                    url: page.url
                }
            });
            
            // 4. Update Source Status to Indexed
            await supabaseAdmin.from('knowledge_sources').update({
                status: 'indexed',
                page_count: 1
            }).eq('id', sourceId);
        }

        console.log(`Total generated chunks: ${chunksToInsert.length}. Inserting into Supabase...`);

        // 5. Batch Insert into Supabase (in batches of 100 to avoid request size limits)
        const batchSize = 100;
        for (let i = 0; i < chunksToInsert.length; i += batchSize) {
            const batch = chunksToInsert.slice(i, i + batchSize);
            const { error: insertError } = await supabaseAdmin
                .from('knowledge_chunks')
                .insert(batch);

            if (insertError) {
                throw new Error(`DB Insert Error at batch ${i}: ${insertError.message}`);
            }
        }

        console.log(`Successfully completed deep scraping for ${url}`);
        
        // 6. Set agent status to ready
        await supabaseAdmin.from('agents').update({ status: 'ready' }).eq('id', agentId);
        
    } catch (error: any) {
        console.error(`Scrape Job Failed: ${error.message}`);
        
        // Set agent status to error on failure
        await supabaseAdmin.from('agents').update({ status: 'error' }).eq('id', agentId);
        
        throw error;
    }
}
