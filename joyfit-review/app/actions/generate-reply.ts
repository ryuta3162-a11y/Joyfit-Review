"use server";

import OpenAI from "openai";

type GenerateReplyInput = {
  reviewText: string;
  rating: number;
  storeName: string;
  customSystemPrompt?: string;
};

const defaultSystemPrompt =
  "あなたはJOYFIT店舗スタッフです。丁寧で親しみやすく、短すぎず冗長すぎない日本語で返信してください。";

export async function generateReviewReply(input: GenerateReplyInput) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: input.customSystemPrompt ?? defaultSystemPrompt,
      },
      {
        role: "user",
        content: `店舗名: ${input.storeName}
評価: ${input.rating} / 5
口コミ本文: ${input.reviewText}

上記口コミへの返信文を、JOYFITの店舗スタッフとして100〜180文字で作成してください。`,
      },
    ],
  });

  return completion.output_text;
}
