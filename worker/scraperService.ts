import { spawn } from 'child_process';
import path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma'; // Share the Prisma client

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
});

export async function runScrapeJob(agentId: string, url: string) {
    console.log(`Starting deep scrape job for Agent: ${agentId}, URL: ${url}`);

    try {
        // 0. Set agent status to scraping
        await prisma.agent.update({
            where: { id: agentId },
            data: { status: 'scraping' }
        });

        // 1. Run the Sequential Python script
        console.log(`Spidering ${url} with custom sequential scraper... this may take some time.`);
        
        // Use process.cwd() to anchor path to root directory
        const scriptPath = path.resolve(process.cwd(), 'scripts/crawl4ai_service.py');
        const isWindows = process.platform === 'win32';
        const pythonExecutable = isWindows 
            ? path.resolve(process.cwd(), 'venv/Scripts/python.exe')
            : 'python3'; // Production path for python

        const crawlResult = await new Promise<any>((resolve, reject) => {
            const pythonProcess = spawn(pythonExecutable, [scriptPath, url]);
            
            let stdoutData = '';
            let stderrData = '';

            pythonProcess.on('error', (err) => {
                reject(new Error(`Failed to start python process: ${err.message}`));
            });
            
            pythonProcess.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Crawler script exited with code ${code}. Stderr: ${stderrData}`));
                    return;
                }
                
                try {
                    const output = stdoutData.trim();
                    let jsonStr = output;
                    const jsonStart = output.indexOf('{');
                    const jsonEnd = output.lastIndexOf('}');
                    
                    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                        jsonStr = output.substring(jsonStart, jsonEnd + 1);
                    }
                    
                    const result = JSON.parse(jsonStr);
                    if (result.error) reject(new Error(result.error));
                    else resolve(result);
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

        // 2. Process each page
        for (const page of pages) {
            const rawText = page.content;
            if (!rawText) continue;
            
            // Create knowledge source
            const sourceId = uuidv4();
            await prisma.knowledgeSource.create({
                data: {
                    id: sourceId,
                    agentId: agentId,
                    sourceType: 'website',
                    title: page.title || new URL(page.url).pathname || 'Website Page',
                    url: page.url,
                    status: 'processing'
                }
            });
            
            const chunkContent = `Product Name: ${page.title}\nURL: ${page.url}\nDescription/Content: ${rawText}`;

            // 3. Generate Embedding
            const allVectors = await embeddings.embedDocuments([chunkContent]);
            const embeddingArray = allVectors[0];
            // Format array as Postgres vector string
            const embeddingString = `[${embeddingArray.join(',')}]`;
            
            // 4. Insert Chunk using raw SQL to support pgvector type
            const metadata = JSON.stringify({ title: page.title, url: page.url });
            
            await prisma.$executeRawUnsafe(`
                INSERT INTO "KnowledgeChunk" ("id", "sourceId", "agentId", "content", "chunkIndex", "embedding", "metadata")
                VALUES (
                    gen_random_uuid(), 
                    '${sourceId}'::uuid, 
                    '${agentId}'::uuid, 
                    $1, 
                    0, 
                    '${embeddingString}'::vector, 
                    $2::jsonb
                )
            `, chunkContent, metadata);

            // 5. Update Source Status
            await prisma.knowledgeSource.update({
                where: { id: sourceId },
                data: { status: 'indexed', pageCount: 1 }
            });
        }

        console.log(`Successfully completed deep scraping for ${url}`);
        
        // 6. Set agent status to ready
        await prisma.agent.update({
            where: { id: agentId },
            data: { status: 'ready' }
        });
        
    } catch (error: any) {
        console.error(`Scrape Job Failed: ${error.message}`);
        await prisma.agent.update({
            where: { id: agentId },
            data: { status: 'error' }
        });
        throw error;
    }
}
