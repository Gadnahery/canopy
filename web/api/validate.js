export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function extractJpegFromMultipart(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const headerEndBuffer = Buffer.from('\r\n\r\n');
  
  const boundaryIndex = buffer.indexOf(boundaryBuffer);
  if (boundaryIndex === -1) return buffer;
  
  const headerStartIndex = boundaryIndex + boundaryBuffer.length;
  const headerEndIndex = buffer.indexOf(headerEndBuffer, headerStartIndex);
  if (headerEndIndex === -1) return buffer;
  
  const fileStartIndex = headerEndIndex + headerEndBuffer.length;
  const fileEndIndex = buffer.indexOf(boundaryBuffer, fileStartIndex);
  if (fileEndIndex === -1) return buffer.slice(fileStartIndex);
  
  return buffer.slice(fileStartIndex, fileEndIndex - 2);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawBuffer = await getRawBody(req);
    let jpegBuffer = rawBuffer;

    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      const match = contentType.match(/boundary=(.+)$/);
      if (match && match[1]) {
        jpegBuffer = extractJpegFromMultipart(rawBuffer, match[1]);
      }
    }

    const base64 = jpegBuffer.toString('base64');
    const hfToken = process.env.HUGGINGFACE_API_TOKEN;
    if (!hfToken) {
      return res.status(500).json({ error: "HUGGINGFACE_API_TOKEN is not configured in Vercel environment variables" });
    }

    let hfResponse;
    try {
      hfResponse = await fetch("https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          inputs: {
            image: base64,
            candidate_labels: [
              "a photo looking up through tree canopy at the sky",
              "an unrelated or random photo",
              "a photo of a person",
              "a photo taken indoors",
              "a blurry, dark, or unclear photo",
            ]
          }
        })
      });
    } catch (e) {
      hfResponse = await fetch("https://api.huggingface.co/models/openai/clip-vit-base-patch32", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          inputs: {
            image: base64,
            candidate_labels: [
              "a photo looking up through tree canopy at the sky",
              "an unrelated or random photo",
              "a photo of a person",
              "a photo taken indoors",
              "a blurry, dark, or unclear photo",
            ]
          }
        })
      });
    }

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      return res.status(500).json({ error: `Hugging Face request failed: ${errText}` });
    }

    const result = await hfResponse.json();
    if (!Array.isArray(result) || result.length === 0) {
      return res.status(500).json({ error: "Invalid response from Hugging Face API" });
    }

    const canopyLabel = "a photo looking up through tree canopy at the sky";
    const bestResult = result[0];
    const canopyResult = result.find((r) => r.label === canopyLabel);

    const predictedLabel = bestResult.label;
    const confidence = canopyResult ? canopyResult.score : 0;
    const valid = predictedLabel === canopyLabel && confidence > 0.55;

    return res.status(200).json({
      valid,
      confidence,
      predicted_label: predictedLabel,
      rejection_reason: valid ? null : "not a valid canopy image",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
