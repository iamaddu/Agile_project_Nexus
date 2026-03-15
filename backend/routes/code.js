const express = require('express');
const vm = require('vm');
const router = express.Router();

// Code execution
router.post('/run', async (req, res) => {
  try {
    const { language, code, input } = req.body;

    if (language.toLowerCase() === 'javascript') {
      // Run JavaScript safely using vm
      try {
        const sandbox = { console: { log: (...args) => output += args.join(' ') + '\n' } };
        let output = '';
        const script = new vm.Script(code);
        const context = vm.createContext(sandbox);
        script.runInContext(context);
        res.json({ output: output || 'Code executed successfully (no console.log output)' });
      } catch (error) {
        res.json({ output: 'Error: ' + error.message });
      }
    } else {
      // For other languages, use Judge0 if API key is set
      const apiKey = process.env.JUDGE0_API_KEY;
      if (!apiKey || apiKey === 'your-judge0-api-key-here') {
        return res.status(400).json({ error: 'Code execution for ' + language + ' requires Judge0 API key. Please set JUDGE0_API_KEY in .env' });
      }

      // Map language names to Judge0 language IDs
      const languageMap = {
        'python': 71,
        'java': 62,
        'cpp': 54, // C++
        'c': 50,
        'csharp': 51, // C#
        'php': 68,
        'ruby': 72,
        'go': 60,
        'rust': 73,
        'kotlin': 78,
        'swift': 83,
        'typescript': 74,
        'r': 80,
        'scala': 81,
        'perl': 85,
        'haskell': 61,
        'lua': 64,
        'dart': 84,
        'bash': 46,
      };

      const languageId = languageMap[language.toLowerCase()];
      if (!languageId) {
        return res.status(400).json({ error: 'Unsupported language' });
      }

      // Submit code to Judge0
      const submitResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: code,
          stdin: input || '',
          expected_output: null,
          cpu_time_limit: 5,
          memory_limit: 128000,
        })
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit code');
      }

      const submitData = await submitResponse.json();
      const token = submitData.token;

      // Wait a bit and get result
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      if (!resultResponse.ok) {
        throw new Error('Failed to get result');
      }

      const resultData = await resultResponse.json();

      res.json({
        output: resultData.stdout || resultData.stderr || resultData.compile_output || 'No output',
        error: resultData.stderr || resultData.compile_output,
        status: resultData.status?.description || 'Unknown'
      });
    }

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

module.exports = router;