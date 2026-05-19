import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,

  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const completion =
      await client.chat.completions.create({

        model: "openrouter/owl-alpha",

        messages: body.messages,

      });

    return Response.json({
      response:
        completion.choices[0].message.content,
    });

  } catch (error: any) {

    return Response.json({
      error: error.message,
    });
  }
}