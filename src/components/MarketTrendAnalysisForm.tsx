import { useState } from 'react';
import { auth } from '@/lib/firebase';

const CATEGORIES = [
  'Electronics',
  'Automotive',
  'Fashion',
  'Home & Garden',
  'Food & Beverage',
  'Health & Beauty',
  'Industrial',
  'Other',
];

export default function MarketTrendAnalysisForm() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [country, setCountry] = useState('');
  const [usageType, setUsageType] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Get the current user's ID token
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const response = await fetch('/api/generate-market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName,
          category,
          country,
          usageType,
          priceRange: { min: priceMin, max: priceMax },
        }),
      });
      if (!response.ok) throw new Error('Failed to generate analysis');
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Market Trend Analysis</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Product Name</label>
          <input type="text" className="mt-1 block w-full border rounded p-2" value={productName} onChange={e => setProductName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Product Category</label>
          <select className="mt-1 block w-full border rounded p-2" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Target Market Country</label>
          <input type="text" className="mt-1 block w-full border rounded p-2" value={country} onChange={e => setCountry(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Expected Usage Type</label>
          <input type="text" className="mt-1 block w-full border rounded p-2" value={usageType} onChange={e => setUsageType(e.target.value)} placeholder="e.g. Retail, B2B" required />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Price Min</label>
            <input type="number" className="mt-1 block w-full border rounded p-2" value={priceMin} onChange={e => setPriceMin(e.target.value)} required />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Price Max</label>
            <input type="number" className="mt-1 block w-full border rounded p-2" value={priceMax} onChange={e => setPriceMax(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Trends'}
        </button>
      </form>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {result && (
        <div className="mt-8">
          {/* Placeholder for charts and results */}
          <h3 className="text-lg font-bold mb-2">Results</h3>
          <div className="mb-4">[Graphs of consumer trend curves]</div>
          <div className="mb-4">[Seasonal demand cycles]</div>
          <div className="mb-4">[Keyword popularity index]</div>
          <div className="mb-4">[Summary insights: {result.summary || '...'}</div>
          <div className="flex gap-4 mt-6">
            <button className="bg-gray-200 px-4 py-2 rounded">Download PDF Report</button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Email Report</button>
          </div>
        </div>
      )}
    </div>
  );
} 