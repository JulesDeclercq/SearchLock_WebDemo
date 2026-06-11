import React, { useMemo, useRef, useState } from 'react';
import { analyzeImage, type AnalysisResult } from './imageAnalysis';
import { searchShoppingResults, type ShoppingResult } from './search';

type DemoState = 'idle' | 'analyzing' | 'searching' | 'ready' | 'error';

const EMPTY_RESULTS: ShoppingResult[] = [];

export default function App() {
  const [state, setState] = useState<DemoState>('idle');
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShoppingResult[]>(EMPTY_RESULTS);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const dragHint = useMemo(() => {
    if (state === 'analyzing') return 'Analyzing the image locally...';
    if (state === 'searching') return 'Generating a search query and fetching products...';
    if (state === 'ready') return 'Drop another image to try again.';
    return 'Drag a photo here, or click to browse.';
  }, [state]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setState('idle');
    setFileName('');
    setPreviewUrl(null);
    setAnalysis(null);
    setQuery('');
    setResults(EMPTY_RESULTS);
    setError(null);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setState('error');
      setError('Please drop a PNG, JPG, JPEG, GIF, or WebP image.');
      return;
    }

    reset();
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);
    setFileName(file.name);
    setState('analyzing');

    try {
      const imageAnalysis = await analyzeImage(file);
      setAnalysis(imageAnalysis);
      setQuery(imageAnalysis.generatedQuery);
      setState('searching');

      const shoppingResults = await searchShoppingResults(imageAnalysis.generatedQuery);
      setResults(shoppingResults);
      setState('ready');
    } catch (cause) {
      setState('error');
      setError(cause instanceof Error ? cause.message : 'Something went wrong while processing the image.');
    }
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const onFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">SearchLock browser proof of concept</p>
        <h1>Drop an image. Get a search query. See what the product would do.</h1>
        <p className="lead">
          This is a browser-only demo that proves the core loop: drag in a photo, analyze it locally,
          generate a shopping-style query, and display matching results.
        </p>
      </section>

      <section
        className={`dropzone ${state === 'error' ? 'dropzone-error' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFileInputChange} />
        <div className="dropzone-copy">
          <span className="dropzone-icon">⬆️</span>
          <h2>{dragHint}</h2>
          <p>Supports JPG, PNG, GIF, and WebP. No upload required for the analysis step.</p>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel preview-panel">
          <header>
            <h3>Preview</h3>
            {fileName ? <p>{fileName}</p> : <p>No image selected yet.</p>}
          </header>
          <div className="preview-frame">
            {previewUrl ? (
              <img src={previewUrl} alt="Dropped preview" className="preview-image" />
            ) : (
              <div className="empty-state">Your image preview appears here.</div>
            )}
          </div>
          <div className="button-row">
            <button type="button" className="secondary" onClick={() => inputRef.current?.click()}>
              Choose image
            </button>
            <button type="button" className="ghost" onClick={reset} disabled={state === 'idle'}>
              Reset
            </button>
          </div>
        </article>

        <article className="panel analysis-panel">
          <header>
            <h3>Local analysis</h3>
            <p>The app inspects the file in your browser and synthesizes a query.</p>
          </header>
          {analysis ? (
            <div className="stat-list">
              <Stat label="Width" value={`${analysis.width}px`} />
              <Stat label="Height" value={`${analysis.height}px`} />
              <Stat label="Aspect" value={analysis.aspectRatioLabel} />
              <Stat label="Brightness" value={analysis.brightnessLabel} />
              <Stat label="Dominant color" value={analysis.dominantColorName} />
            </div>
          ) : (
            <div className="placeholder-box">Drop a file to see analysis details.</div>
          )}
          <div className="query-box">
            <span className="query-label">Generated query</span>
            <p>{query || '—'}</p>
          </div>
          {error ? <div className="error-box">{error}</div> : null}
        </article>
      </section>

      <section className="panel results-panel">
        <header>
          <h3>Results</h3>
          <p>
            {state === 'ready'
              ? `${results.length} items found for the generated query.`
              : 'Results will appear after analysis completes.'}
          </p>
        </header>
        <div className="results-grid">
          {results.length > 0 ? (
            results.map((result) => (
              <a
                key={result.title}
                className="result-card"
                href={result.url}
                target="_blank"
                rel="noreferrer"
              >
                <div className="result-image" style={{ backgroundImage: `url(${result.imageUrl})` }} />
                <div className="result-copy">
                  <h4>{result.title}</h4>
                  <p>{result.price}</p>
                  <span>{result.source}</span>
                </div>
              </a>
            ))
          ) : (
            <div className="placeholder-box">Nothing to show yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
