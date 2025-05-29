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
2. [Subject] didn't [base verb] OR [Subject] wasn't/weren't (for 'be')
3. Did [subject] [base verb]? OR Was/Were [subject]? (for 'be')
4. [Appropriate wh-word] did [subject] [base verb]? OR [Wh-word] was/were [subject]? (for 'be')

Rules:
- Use the correct past form: be→was/were, beat→beat, become→became, begin→began, break→broke, bring→brought, build→built, buy→bought, catch→caught, choose→chose, come→came, cost→cost, do→did, draw→drew, dream→dreamt, drink→drank, drive→drove, eat→ate, fall→fell, feel→felt, find→found, fix→fixed, fly→flew, get→got, give→gave, go→went, grow→grew, have→had, hear→heard, know→knew, learn→learnt, leave→left, lie→lay, make→made, meet→met, play→played, put→put, read→read, run→ran, say→said, see→saw, seek→sought, show→showed, sing→sang, sit→sat, sleep→slept, speak→spoke, stand→stood, study→studied, swim→swam, take→took, teach→taught, tell→told, think→thought, throw→threw, understand→understood, work→worked, write→wrote
- For 'be': use 'was' with I/he/she/it, use 'were' with you/we/they. Negative: wasn't/weren't. Questions: Was I? Were they?
- For the 4th sentence, choose the most appropriate wh-word based on the verb:
  * Where: go, come, drive, fly, run, walk, swim, sit, stand, put, throw, fall
  * What: do, make, say, eat, drink, buy, read, write, draw, build, fix, choose, think, dream, break, catch, give, take, bring, see, hear, feel
  * Who/Whom: meet, teach, beat, tell
  * When: begin, leave, sleep
  * How much: cost
  * Why: cry, understand
- ONLY output the 4 sentences, one per line
- NO explanations, NO additional text

Examples:
Subject: "I", Verb: "go"
I went
I didn't go
Did I go?
Where did I go?

Subject: "she", Verb: "eat"
She ate
She didn't eat
Did she eat?
What did she eat?

Subject: "they", Verb: "meet"
They met
They didn't meet
Did they meet?
Who did they meet?

Subject: "I", Verb: "be"
I was
I wasn't
Was I?
Where was I?

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
4. [Appropriate wh-word] will [subject] [base verb]?

Rules:
- Future Simple uses "will" for ALL subjects
- Negative uses "won't" (will not)
- Questions start with "Will"
- Always use base form of verb after will/won't
- For the 4th sentence, choose the most appropriate wh-word based on the verb:
  * Where: go, come, drive, fly, run, walk, swim, sit, stand, put, throw, fall, be
  * What: do, make, say, eat, drink, buy, read, write, draw, build, fix, choose, think, dream, break, catch, give, take, bring, see, hear, feel
  * Who/Whom: meet, teach, beat, tell
  * When: begin, leave, sleep
  * How much: cost
  * Why: cry, understand
- ONLY output the 4 sentences, one per line
- NO explanations, NO additional text

Examples:
Subject: "I", Verb: "go"
I will go
I won't go
Will I go?
Where will I go?

Subject: "she", Verb: "make"
She will make
She won't make
Will she make?
What will she make?

Subject: "they", Verb: "meet"
They will meet
They won't meet
Will they meet?
Who will they meet?

Subject: "it", Verb: "cost"
It will cost
It won't cost
Will it cost?
How much will it cost?

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
4. [Appropriate wh-word] [auxiliary] [subject] [base verb]?

Rules:
- For I/you/we/they/plural nouns: use base form of verb, "don't", "do"
- For he/she/it/singular nouns: add -s/-es to verb, use "doesn't", "does"
- Special cases: be (am/is/are), have (has), do (does)
- For 'be': I am, you/we/they are, he/she/it is. Questions: Am I? Is he? Are they? Negatives: I am not, he is not, they are not
- For the 4th sentence, choose the most appropriate wh-word based on the verb:
  * Where: go, come, drive, fly, run, walk, swim, sit, stand, put, throw, fall, be
  * What: do, make, say, eat, drink, buy, read, write, draw, build, fix, choose, think, dream, break, catch, give, take, bring, see, hear, feel, have
  * Who/Whom: meet, teach, beat, tell, know
  * When: begin, leave, sleep, work, study, play
  * How much: cost
  * Why: cry, understand
  * How: speak, feel
- ONLY output the 4 sentences, one per line
- NO explanations, NO additional text

Examples:
Subject: "I", Verb: "go"
I go
I don't go
Do I go?
Where do I go?

Subject: "she", Verb: "eat"
She eats
She doesn't eat
Does she eat?
What does she eat?

Subject: "I", Verb: "be"
I am
I am not
Am I?
Where am I?

Subject: "they", Verb: "meet"
They meet
They don't meet
Do they meet?
Who do they meet?

Subject: "he", Verb: "work"
He works
He doesn't work
Does he work?
When does he work?

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
