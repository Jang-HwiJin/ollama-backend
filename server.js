const express = require('express');
const app = express();

app.use(express.json()); // parse JSON body

app.post('/api/parse-song', async (req, res) => {
  const { title, channelName } = req.body;

  const prompt = `
    Extract the artist name(s) and song title from the following YouTube music video information.

YouTube Title: "${title}"
YouTube Channel: "${channelName}"

Respond ONLY with a JSON object in this exact format:
{
  "artist": "artist name",
  "songTitle": "song title"
}

Instructions:
- The artist's name is most often mentioned inside the title, typically near delimiters like "-", "|", or the word "by".
- If the title contains labels or tags such as "[M/V]", "(Official Video)", "feat.", or channel-related info, ignore these when extracting the artist.
- Prioritize extracting the artist from the title text itself, NOT from the channel name, unless the title does not clearly contain an artist name.
- Only use the channel name as the artist if no clear artist can be found in the title.
- For example, given the title "[M/V] BOL4(볼빨간사춘기) - Some(썸 탈꺼야)" and channel "SUPER SOUND", the correct extraction is:
  artist: "BOL4(볼빨간사춘기)"
  songTitle: "Some(썸 탈꺼야)"
- Do not include any extra text, explanations, or formatting—only return the JSON object.

Examples:
Title: "[M/V] BOL4(볼빨간사춘기) - Some(썸 탈꺼야)"
Channel: "SUPER SOUND"
Result: { "artist": "BOL4(볼빨간사춘기)", "songTitle": "Some(썸 탈꺼야)" }

Title: "Song Name by Famous Artist"
Channel: "Official Channel"
Result: { "artist": "Famous Artist", "songTitle": "Song Name" }
    `;

  try {
    const ollamaResp = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma:2b',
        prompt,
        stream: false,
      }),
    });

    const data = await ollamaResp.json();

    let parsedData;
    try {
      parsedData = JSON.parse(data.response);
    } catch (err) {
      parsedData = { artist: channelName, songTitle: title };
    }

    // Add CORS headers for your Chrome extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle CORS preflight requests
app.options('/api/parse-song', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
