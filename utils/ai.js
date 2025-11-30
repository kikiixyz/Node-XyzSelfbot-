const fetch = (await import("node-fetch")).default;

async function generateImage(prompt) {
  const response = await fetch("https://api.freepik.com/v1/ai/mystic", {
    method: "POST",
    headers: {
      "x-freepik-api-key": "FPSX7fd6ce6f1cc74a64f44472787185298e",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt,
      filter_nsfw: true,
      model: "realism",
      resolution: "2k",
      aspect_ratio: "square_1_1",
      fixed_generation: false
    })
  });

  const data = await response.json();
  return data.data.task_id;
}

async function waitResult(taskId) {
  while (true) {
    const res = await fetch(`https://api.freepik.com/v1/ai/mystic/${taskId}`, {
      headers: { "x-freepik-api-key": "FPSX7fd6ce6f1cc74a64f44472787185298e" }
    });

    const result = await res.json();

    if (result.data.status === "COMPLETED") return result.data.generated[0]; // URL gambar
    if (result.data.status === "FAILED") throw new Error("Gagal generate gambar");

    await new Promise(r => setTimeout(r, 1500));
  }
}

export { generateImage, waitResult };