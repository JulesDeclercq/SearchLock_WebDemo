export interface ShoppingResult {
  title: string;
  price: string;
  imageUrl: string;
  url: string;
  source: string;
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=60',
];

export async function searchShoppingResults(query: string): Promise<ShoppingResult[]> {
  const apiKey = import.meta.env.VITE_SERPAPI_KEY as string | undefined;
  if (apiKey) {
    try {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_shopping');
      url.searchParams.set('q', query);
      url.searchParams.set('api_key', apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Shopping search failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        shopping_results?: Array<{
          title?: string;
          price?: string;
          thumbnail?: string;
          link?: string;
          source?: string;
        }>;
      };

      const results = (payload.shopping_results ?? []).slice(0, 6).map((item, index) => ({
        title: item.title ?? `Result ${index + 1}`,
        price: item.price ?? 'View price',
        imageUrl: item.thumbnail ?? fallbackImages[index % fallbackImages.length] ?? fallbackImages[0],
        url: item.link ?? 'https://serpapi.com/',
        source: item.source ?? 'SerpApi',
      }));

      if (results.length > 0) {
        return results;
      }
    } catch {
      // Fall back to mock results below.
    }
  }

  return buildMockResults(query);
}

function buildMockResults(query: string): ShoppingResult[] {
  const tokens = query.split(/\s+/).filter(Boolean);
  const label = tokens.slice(0, 4).join(' ');

  return [
    {
      title: `${label} Option A`,
      price: '$24.99',
      imageUrl: fallbackImages[0],
      url: 'https://example.com/product-a',
      source: 'Demo Marketplace',
    },
    {
      title: `${label} Option B`,
      price: '$39.00',
      imageUrl: fallbackImages[1],
      url: 'https://example.com/product-b',
      source: 'Demo Marketplace',
    },
    {
      title: `${label} Option C`,
      price: '$58.50',
      imageUrl: fallbackImages[2],
      url: 'https://example.com/product-c',
      source: 'Demo Marketplace',
    },
  ];
}
