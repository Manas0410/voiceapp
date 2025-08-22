import axios from "axios";

export async function POST(req) {
  console.log("HF Key:", process.env.HUGGINGFACE_API_KEY);

  try {
    const body = await req.json();
    const { text } = body;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/mms-tts-eng",
      { inputs: text }, // ✅ Hugging Face expects JSON with "inputs"
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    return new Response(response.data, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS error:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({ error: "Failed to generate speech" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
