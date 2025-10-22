'use client';

import { useMemo, useState } from 'react';
import { LANGUAGES, getLanguageDisplay, type Language } from '@/lib/languages';

type TranslationRecord = {
  id: string;
  input: string;
  output: string;
  source: Language;
  target: Language;
  createdAt: Date;
};

const MAX_HISTORY_ITEMS = 6;

export default function HomePage() {
  const [sourceLanguageCode, setSourceLanguageCode] = useState<string>('en');
  const [targetLanguageCode, setTargetLanguageCode] = useState<string>('es');
  const [text, setText] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<TranslationRecord[]>([]);

  const sourceLanguage = useMemo(
    () => LANGUAGES.find((lang) => lang.code === sourceLanguageCode) ?? LANGUAGES[0],
    [sourceLanguageCode]
  );

  const targetLanguage = useMemo(
    () => LANGUAGES.find((lang) => lang.code === targetLanguageCode) ?? LANGUAGES[1],
    [targetLanguageCode]
  );

  const canTranslate = text.trim().length > 0 && !isLoading;

  async function handleTranslate() {
    setIsLoading(true);
    setStatusMessage('Translating…');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          source: sourceLanguage.code,
          target: targetLanguage.code
        })
      });

      const result = (await response.json()) as { translation?: string; error?: string };

      if (!response.ok || result.error) {
        throw new Error(result.error ?? 'Translation failed');
      }

      const translatedText = result.translation ?? '';
      setTranslation(translatedText);
      setStatusMessage('Translation complete.');

      if (translatedText.trim().length > 0) {
        setHistory((prev) => {
          const record: TranslationRecord = {
            id: crypto.randomUUID(),
            input: text,
            output: translatedText,
            source: sourceLanguage,
            target: targetLanguage,
            createdAt: new Date()
          };

          const updated = [record, ...prev];
          return updated.slice(0, MAX_HISTORY_ITEMS);
        });
      }
    } catch (error) {
      console.error(error);
      setStatusMessage('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSwapLanguages() {
    setSourceLanguageCode(targetLanguageCode);
    setTargetLanguageCode(sourceLanguageCode);
    setTranslation('');
    setStatusMessage('Languages swapped. Ready to translate again.');
  }

  function handleReset() {
    setText('');
    setTranslation('');
    setStatusMessage('Cleared. Enter new text to translate.');
  }

  return (
    <main>
      <header>
        <h1>Polyglot</h1>
        <p className="lead">
          A sleek translator that bridges languages instantly. Type, choose your languages, and let
          Polyglot do the rest.
        </p>
      </header>

      <section className="translator-grid" aria-label="Translator controls">
        <article className="panel">
          <label htmlFor="source-language">From</label>
          <select
            id="source-language"
            value={sourceLanguageCode}
            onChange={(event) => setSourceLanguageCode(event.target.value)}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name} · {language.nativeName}
              </option>
            ))}
          </select>

          <label htmlFor="text-input">Source text</label>
          <textarea
            id="text-input"
            placeholder="Type or paste the text you want to translate"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />

          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={handleTranslate}
              disabled={!canTranslate}
            >
              {isLoading ? 'Translating…' : 'Translate'}
            </button>
            <button
              type="button"
              className="button swap-button"
              onClick={handleSwapLanguages}
              disabled={isLoading}
            >
              Swap languages
            </button>
            <button
              type="button"
              className="button swap-button"
              onClick={handleReset}
              disabled={isLoading && text.length === 0}
            >
              Clear
            </button>
          </div>

          <p className="status-line" role="status" aria-live="polite">
            {statusMessage || 'Ready when you are.'}
          </p>
        </article>

        <article className="panel">
          <label htmlFor="target-language">To</label>
          <select
            id="target-language"
            value={targetLanguageCode}
            onChange={(event) => setTargetLanguageCode(event.target.value)}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name} · {language.nativeName}
              </option>
            ))}
          </select>

          <label htmlFor="translation-output">Translation</label>
          <div id="translation-output" className="translation-output" aria-live="polite">
            {translation || 'Your translation will appear here.'}
          </div>
        </article>
      </section>

      <section aria-label="Translation history" style={{ marginTop: '2.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Recent translations</h2>
        {history.length === 0 ? (
          <div className="empty-state">
            No translations yet. Your recent translation sessions will appear here.
          </div>
        ) : (
          <div className="history">
            {history.map((record) => (
              <article key={record.id} className="history-card">
                <header>
                  <span>{getLanguageDisplay(record.source.code)}</span>
                  <span>→ {getLanguageDisplay(record.target.code)}</span>
                </header>
                <div>
                  <label>Input</label>
                  <p>{record.input}</p>
                </div>
                <div>
                  <label>Output</label>
                  <p>{record.output}</p>
                </div>
                <small>{record.createdAt.toLocaleString()}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
