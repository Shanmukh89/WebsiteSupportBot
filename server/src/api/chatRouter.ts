import { Router } from 'express';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

import { supabaseAdmin } from '../services/supabase';
import { config } from '../utils/config';

const router = Router();

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openai.apiKey,
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
});

const llm = new ChatOpenAI({
    openAIApiKey: config.openai.apiKey,
    modelName: 'gpt-4o-mini',
    temperature: 0.1,
    streaming: true,
});

router.post('/', async (req, res) => {
    const { agentId, message, history = [] } = req.body;

    console.log(`[Chat] Received request - agentId: ${agentId}, message: "${message}", history length: ${history.length}`);

    if (!agentId || !message) {
        return res.status(400).json({ error: 'agentId and message are required' });
    }

    try {
        // 1. Generate embedding for the user's question
        const [questionEmbedding] = await embeddings.embedDocuments([message]);
        console.log(`[Chat] Generated embedding for question: "${message}" (dim: ${questionEmbedding.length})`);

        // 2. Perform Vector Search via Supabase RPC
        const { data: matchedChunks, error } = await supabaseAdmin.rpc('match_chunks', {
            query_embedding: questionEmbedding,
            match_agent_id: agentId,
            match_threshold: 0.25,
            match_count: 20
        });

        if (error) {
            console.error('[Chat] Vector Search Error:', error);
            return res.status(500).json({ error: 'Failed to search knowledge base' });
        }

        // 3. Debug: Log matched chunks - PHASE 7 DEFENSIVE LOGGING
        console.log('=== CHAT REQUEST ===');
        console.log('Agent ID from request:', agentId);
        console.log('Chunks retrieved:', matchedChunks?.length || 0);
        if (matchedChunks && matchedChunks.length > 0) {
            console.log('First chunk preview:', matchedChunks[0].content?.slice(0, 100));
            // @ts-ignore
            console.log('First chunk agent_id:', matchedChunks[0].agent_id);
        }
        console.log('===================');

        // 4. Guard: if no chunks found, return early without calling LLM (Fix 2)
        if (!matchedChunks || matchedChunks.length === 0) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            const fallbackMessage = "I don't have product data loaded yet. Please try re-scraping.";
            res.write(`data: ${JSON.stringify({ text: fallbackMessage })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
        }

        // 4b. Construct the context from the matched chunks
        // @ts-ignore
        const contextText = matchedChunks?.map((chunk: any) => chunk.content).join('\n\n') || '';

        // 5. Set up the LLM Prompt Chain (Phase 6 Fix - Conversational Refusal)
        const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful customer support assistant exclusively for {storeName}.
Your store URL is {storeUrl}.

YOUR ONLY SOURCE OF TRUTH IS THE CONTEXT PROVIDED BELOW.

ABSOLUTE RULES:
1. You ONLY answer using information from the CONTEXT section below.
2. You NEVER use your training knowledge for product information.
3. You NEVER mention any other store, brand, or website.
4. You NEVER fabricate product names, prices, specifications, or URLs.
5. Every product you mention MUST have its exact URL from the context.
6. When a user asks about a brand or category, search ALL products in the CONTEXT and list EVERY matching product.
7. For product URLs, extract the EXACT URL from the "URL:" field in each product's context entry. Format as a clickable markdown link: [Product Name](exact_url). NEVER modify, shorten, or fabricate URLs.

SEARCH & RESPONSE STRATEGY:
- When a user mentions a brand name (e.g. "Nothing"), product type (e.g. "smartwatches"), or any keyword, scan ALL products in the CONTEXT for matches in brand, product name, or description. Include partial matches (e.g. "CMF by Nothing" matches "Nothing").
- If MULTIPLE products match, list ALL of them. For each product use this format:
  **Product Name** — Price — [View Product](exact_url_from_context)
- ONLY if absolutely NO products in the CONTEXT match the user's query, politely say you don't see that specific item in the current catalogue for {storeName}, and suggest browsing the categories you DO have.
- Keep responses conversational, warm, and helpful.

CONTEXT (Your only source of truth):
{retrievedChunks}

If CONTEXT is completely empty, say exactly:
"I don't have product data loaded yet. Please try re-scraping the store."
---
Chat History:
{history}

User Question: {question}
Helpful Answer:`);

        const chain = promptTemplate.pipe(llm);

        // Fetch store info to populate prompt variables (Optional enhancement but needed for {storeName})
        const { data: agentData } = await supabaseAdmin.from('agents').select('name, url').eq('id', agentId).single();
        const storeName = agentData?.name || 'this store';
        const storeUrl = agentData?.url || 'the website';

        // 6. Stream the response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await chain.stream({
            retrievedChunks: contextText,
            storeName,
            storeUrl,
            history: history.map((h: any) => `${h.role}: ${h.text}`).join('\n'),
            question: message
        });

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk.content })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error: any) {
        console.error('Chat API Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'An error occurred during chat generation' });
        } else {
            res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
            res.end();
        }
    }
});

export default router;
