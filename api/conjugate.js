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
        const { subject, verb, tense = 'present' } = req.body;

        if (!subject || !verb) {
            return res.status(400).json({ error: 'Missing subject or verb' });
        }

        // Create a specific prompt based on tense
        let prompt;
        
        if (tense === 'past') {
            prompt = `You are a grammar assistant. Your ONLY job is to conjugate English verbs correctly in PAST SIMPLE tense.

Given:
- Subject: "${subject}"
- Verb: "${verb}"
- Tense: Past Simple

Generate EXACTLY 4 sentences following these patterns:
1. [Subject] [past form of verb]
2. [Subject] didn't [base verb]
3. Did [subject] [base verb]?
4. Where did [subject] [base verb]?

Rules:
- Use the correct past form: be→was/were, beat→beat, become→became, begin→began, break→broke, bring→brought, build→built, buy→bought, catch→caught, choose→chose, come→came, cost→cost, do→did, draw→drew, dream→dreamt, drink→drank, drive→drove, eat→ate, fall→fell, feel→felt, find→found, fix→fixed, fly→flew, get→got, give→gave, go→went, grow→grew, have→had, hear→heard, know→knew, learn→learnt, leave→left, lie→lay, make→made, meet→met, play→played, put→put, read→read, run→ran, say→said, see→saw, seek→sought, show→showed, sing→sang, sit→sat, sleep→slept, speak→spoke, stand→stood, study→studied, swim→swam, take→took, teach→taught, tell→told, think→thought, throw→threw, understand→understood, work→worked, write→wrote
- For 'be': use 'was' with I/he/she/it, use 'were' with you/we/they. Negative: wasn't/weren't. Questions: Was I? Were they?
- For all other verbs: Past Simple uses "didn't" and "did" for ALL subjects
- Questions use auxiliary + base form of verb (Did he go? Was she?)
- ONLY output the 4 sentences, one per line
- NO explanations, NO additional text

Examples:
Subject: "I", Verb: "go"
I went
I didn't go
Did I go?
Where did I go?

Subject: "she", Verb: "fix"
She fixed
She didn't fix
Did she fix?
Where did she fix?

Subject: "I", Verb: "be"
I was
I wasn't
Was I?
Where was I?

Subject: "they", Verb: "be"
They were
They weren't
Were they?
Where were they?

Subject: "my friends", Verb: "get"
My friends got
My friends didn't get
Did my friends get?
Where did my friends get?

Now generate for Subject: "${subject}", Verb: "${verb}"`;
        } else if (tense === 'future') {
            prompt = `You are a grammar assistant. Your ONLY job is to conjugate English verbs correctly in FUTURE SIMPLE tense.

Given:
- Subject: "${subject}"
- Verb: "${verb}"
- Tense: Future Simple

Generate EXACTLY 4 sentences following these patterns:
1. [Subject] will [base verb]
2. [Subject] won't [base verb]
3. Will [subject] [base verb]?
4. Where will [subject] [base verb]?

Rules:
- Future Simple uses "will" for ALL subjects
- Negative uses "won't" (will not)
- Questions start with "Will"
- Always use base form of verb after will/won't
- ONLY output the 4 sentences, one per line
- NO explanations, NO additional text

Examples:
Subject: "I", Verb: "go"
I will go
I won't go
Will I go?
Where will I go?

Subject: "she", Verb: "fix"
She will fix
She won't fix
Will she fix?
Where will she fix?

Subject: "my friends", Verb: "eat"
My friends will eat
My friends won't eat
Will my friends eat?
Where will my friends eat?

Now generate for Subject: "${subject}", Verb: "${verb}"`;
        } else {
            // Present tense prompt (original)
            prompt = `You are a grammar assistant. Your ONLY job is to conjugate English verbs correctly in PRESENT SIMPLE tense.

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
- Special cases: be (am/is/are), have (has), do (does)
- For 'be': I am, you/we/they are, he/she/it is. Questions: Am I? Is he? Are they? Negatives: I am not, he is not, they are not
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

Subject: "I", Verb: "be"
I am
I am not
Am I?
Where am I?

Subject: "they", Verb: "be"
They are
They are not
Are they?
Where are they?

Subject: "my friends", Verb: "fix"
My friends fix
My friends don't fix
Do my friends fix?
Where do my friends fix?

Now generate for Subject: "${subject}", Verb: "${verb}"`;
        }

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

        // Determine scheme info based on tense
        let schemeInfo;
        if (tense === 'past') {
            schemeInfo = 'Past Simple: same form for all subjects';
        } else if (tense === 'future') {
            schemeInfo = 'Future Simple: will + base verb for all subjects';
        } else {
            const isScheme2 = sentences[0].includes(verb + 's') || sentences[0].includes(verb + 'es');
            schemeInfo = isScheme2 
                ? 'Scheme 2: he/she/it forms (third person singular)' 
                : 'Scheme 1: I/you/we/they forms';
        }

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
