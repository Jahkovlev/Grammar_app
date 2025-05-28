// api/conjugate.js - Vercel serverless function
// Save this file in your project's api folder

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // Set this in Vercel environment variables
});

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { subject, verb } = req.body;

        if (!subject || !verb) {
            return res.status(400).json({ error: 'Missing subject or verb' });
        }

        // Create a very specific prompt for Anthropic
        const prompt = `You are a grammar assistant. Your ONLY job is to conjugate English verbs correctly.

Given:
- Subject: "${subject}"
- Verb: "${verb}"

Generate EXACTLY 4 sentences following these patterns:
1. [Subject] [conjugated verb]
2. [Subject] [negative auxiliary] [base verb]
3. [Auxiliary with capital first letter] [subject] [base verb]?
4. Where [auxiliary] [subject] [base verb]?

Rules:
- For I/you/we/they/plural nouns: use base form of verb, "don't", "do"
- For he/she/it/singular nouns: add -s/-es to verb, use "doesn't", "does"
- ONLY output the 4 sentences, one per line
- NO explanations, NO additional text

Examples:
Subject: "I", Verb: "go"
I go
I don't go
Do I go?
Where do I go?

Subject: "she", Verb: "go"
She goes
She doesn't go
Does she go?
Where does she go?

Subject: "my friends", Verb: "fix"
My friends fix
My friends don't fix
Do my friends fix?
Where do my friends fix?

Now generate for Subject: "${subject}", Verb: "${verb}"`;

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307', // Use a cheaper, faster model for simple tasks
            max_tokens: 150,
            temperature: 0, // Deterministic output
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const sentences = response.content[0].text.trim().split('\n').filter(line => line.trim());

        // Determine scheme based on the conjugation used
        const isScheme2 = sentences[0].includes(verb + 's') || sentences[0].includes(verb + 'es');
        const schemeInfo = isScheme2 
            ? 'Scheme 2: he/she/it forms (third person singular)' 
            : 'Scheme 1: I/you/we/they forms';

        return res.status(200).json({
            sentences: sentences,
            schemeInfo: schemeInfo
        });

    } catch (error) {
        console.error('Error calling Anthropic API:', error);
        return res.status(500).json({ 
            error: 'Failed to generate conjugation',
            details: error.message 
        });
    }
};
