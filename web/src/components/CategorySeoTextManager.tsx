'use client';

import { useState, useEffect } from 'react';

interface SeoText {
  _id?: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  seoContent: string;
  type: 'category' | 'subcategory';
  parentCategory?: string;
}

export default function CategorySeoTextManager() {
  const [seoTexts, setSeoTexts] = useState<SeoText[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SeoText | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'category' | 'subcategory'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSeoTexts();
  }, []);

  const fetchSeoTexts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-seo-text`);
      if (response.ok) {
        const data = await response.json();
        setSeoTexts(data);
      }
    } catch (error) {
      console.error('Error fetching SEO texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-seo-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      if (response.ok) {
        await fetchSeoTexts();
        setEditingItem(null);
        alert('הטקסט נשמר בהצלחה!');
      } else {
        alert('שגיאה בשמירת הטקסט');
      }
    } catch (error) {
      console.error('Error saving SEO text:', error);
      alert('שגיאה בשמירת הטקסט');
    } finally {
      setSaving(false);
    }
  };

  const filteredTexts = seoTexts.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group by category for better display
  const categories = filteredTexts.filter(t => t.type === 'category');
  const subcategories = filteredTexts.filter(t => t.type === 'subcategory');

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (editingItem) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            עריכת טקסט SEO: {editingItem.name}
          </h2>
          <button
            onClick={() => setEditingItem(null)}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕ סגור
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">כותרת SEO (Title Tag):</label>
            <input
              type="text"
              value={editingItem.seoTitle || ''}
              onChange={(e) => setEditingItem({ ...editingItem, seoTitle: e.target.value })}
              className="w-full border p-2 rounded"
              placeholder="כותרת הדף שתופיע בתוצאות החיפוש"
              maxLength={60}
            />
            <p className="text-sm text-gray-500 mt-1">
              {editingItem.seoTitle?.length || 0}/60 תווים (מומלץ עד 60)
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-2">תיאור SEO (Meta Description):</label>
            <textarea
              value={editingItem.seoDescription || ''}
              onChange={(e) => setEditingItem({ ...editingItem, seoDescription: e.target.value })}
              className="w-full border p-2 rounded"
              rows={3}
              placeholder="תיאור קצר שיופיע בתוצאות החיפוש"
              maxLength={160}
            />
            <p className="text-sm text-gray-500 mt-1">
              {editingItem.seoDescription?.length || 0}/160 תווים (מומלץ 120-160)
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-2">תוכן SEO (יוצג בדף):</label>
            <textarea
              value={editingItem.seoContent || ''}
              onChange={(e) => setEditingItem({ ...editingItem, seoContent: e.target.value })}
              className="w-full border p-2 rounded"
              rows={10}
              placeholder="טקסט מפורט שיוצג בתחתית דף הקטגוריה"
            />
            <p className="text-sm text-gray-500 mt-1">
              {editingItem.seoContent?.split(/\s+/).filter(Boolean).length || 0} מילים (מומלץ 200-400 מילים)
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button
              onClick={() => setEditingItem(null)}
              className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">ניהול טקסטים SEO לקטגוריות</h2>
      <p className="text-gray-600 mb-4">
        ערוך את הטקסטים שיופיעו בדפי הקטגוריות והתת-קטגוריות לצורך SEO.
      </p>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="חפש קטגוריה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] border p-2 rounded"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'category' | 'subcategory')}
          className="border p-2 rounded"
        >
          <option value="all">הכל</option>
          <option value="category">קטגוריות ראשיות</option>
          <option value="subcategory">תת-קטגוריות</option>
        </select>
      </div>

      {/* Categories Section */}
      {(filterType === 'all' || filterType === 'category') && categories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3 text-blue-700">קטגוריות ראשיות ({categories.length})</h3>
          <div className="space-y-2">
            {categories.map((item) => (
              <div
                key={item._id || item.name}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.seoTitle ? (
                      <span className="text-green-600">✓ יש כותרת SEO</span>
                    ) : (
                      <span className="text-red-600">✗ חסרה כותרת SEO</span>
                    )}
                    {' | '}
                    {item.seoContent ? (
                      <span className="text-green-600">✓ יש תוכן ({item.seoContent.split(/\s+/).filter(Boolean).length} מילים)</span>
                    ) : (
                      <span className="text-red-600">✗ חסר תוכן</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(item)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  ערוך
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subcategories Section */}
      {(filterType === 'all' || filterType === 'subcategory') && subcategories.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 text-green-700">תת-קטגוריות ({subcategories.length})</h3>
          <div className="space-y-2">
            {subcategories.map((item) => (
              <div
                key={item._id || item.name}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-semibold">{item.name.replace(' - ', ' → ')}</div>
                  {item.parentCategory && (
                    <div className="text-xs text-gray-500">קטגוריה ראשית: {item.parentCategory}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    {item.seoTitle ? (
                      <span className="text-green-600">✓ יש כותרת SEO</span>
                    ) : (
                      <span className="text-red-600">✗ חסרה כותרת SEO</span>
                    )}
                    {' | '}
                    {item.seoContent ? (
                      <span className="text-green-600">✓ יש תוכן ({item.seoContent.split(/\s+/).filter(Boolean).length} מילים)</span>
                    ) : (
                      <span className="text-red-600">✗ חסר תוכן</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(item)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  ערוך
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredTexts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'לא נמצאו תוצאות' : 'אין טקסטים SEO עדיין. הפעל את סקריפט ה-seed ליצירת טקסטים ראשוניים.'}
        </div>
      )}
    </div>
  );
}
