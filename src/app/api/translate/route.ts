import { NextResponse } from 'next/server';
import { LANGUAGES } from '@/lib/languages';
import { buildTranslatePayload, type TranslationRequest } from '@/lib/translator';

const SUPPORTED_CODES = new Set(LANGUAGES.map((item) => item.code));
const TRANSLATE_ENDPOINT = 'https://libretranslate.de/translate';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<TranslationRequest>;

    if (!payload.text || !payload.source || !payload.target) {
      return NextResponse.json(
        { error: 'Missing text, source language, or target language.' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_CODES.has(payload.source) || !SUPPORTED_CODES.has(payload.target)) {
      return NextResponse.json(
        { error: 'Unsupported language provided.' },
        { status: 400 }
      );
    }

    if (payload.text.trim().length === 0) {
      return NextResponse.json({ translation: '' }, { status: 200 });
    }

    const response = await fetch(TRANSLATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildTranslatePayload(payload as TranslationRequest))
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Translation service failed to process the request.' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { translatedText?: string };
    if (!data.translatedText) {
      return NextResponse.json(
        { error: 'Translation service returned an unexpected response.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ translation: data.translatedText });
  } catch (error) {
    console.error('Translation API handler error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while translating.' },
      { status: 500 }
    );
  }
}
