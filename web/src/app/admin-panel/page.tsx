'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/redux/actions/productActions';
import { maybeFetchCategories } from '@/lib/redux/actions/categoryActions';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import CategoryImageManager from '@/components/CategoryImageManager';
import CategorySeoTextManager from '@/components/CategorySeoTextManager';
import LeadsManager from '@/components/LeadsManager';
import Breadcrumbs from '@/components/Breadcrumbs';
import { adminPut } from '@/utils/adminApi';
import {
  handleSearch,
  fetchCategories,
  generateCombinations,
  handleInputChange,
  handleRadioChange,
  handleAttributeChange,
  handleAttributeValueChange,
  handleAddAttribute,
  handleAddAttributeValue,
  handleRemoveAttribute,
  handleRemoveAttributeValue
} from '@/lib/utils/adminPanelUtils';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/lib/utils/cloudinaryUpload';
import { processImageUrl } from '@/lib/utils/imageProxyUtils';

const initialProductState = {
  מזהה: '',
  סוג: 'simple',
  'מק"ט': '',
  שם: '',
  'תיאור קצר': '',
  תיאור: '',
  'מחיר מבצע': '',
  'מחיר רגיל': '',
  קטגוריות: [],
  תמונות: '',
  materialGroup: '',
  variations: [],
  attributes: [{ name: '', values: [{ value: '', price: '' }] }],
  quantities: [],
  allowComments: false,
};

export default function AdminPanel() {
  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      <AdminPanelContent />
    </RoleProtectedRoute>
  );
}

function AdminPanelContent() {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.products);
  const categories = useAppSelector((state) => state.categories);

  const [organizedCategories, setOrganizedCategories] = useState<any[]>([]);
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<Record<string, string[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newProduct, setNewProduct] = useState(initialProductState);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  const [materialGroups, setMaterialGroups] = useState<any[]>([]);
  const [siteStats, setSiteStats] = useState({ clients: 0, supplyPoints: 0, onlineUsers: 0, lastOrderMinutes: 0 });
  const [carouselFile, setCarouselFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [quantityEnabled, setQuantityEnabled] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');
  const [editedPrices, setEditedPrices] = useState<Record<string, { minPrice?: number; transportationPrice?: number }>>({});
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(maybeFetchCategories());
  }, [dispatch]);

  useEffect(() => {
    setOrganizedCategories(fetchCategories(categories));
  }, [categories]);

  useEffect(() => {
    setFilteredProducts(handleSearch(searchQuery, products));
  }, [searchQuery, products]);

  useEffect(() => {
    // Fetch site stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site-stats`)
      .then((res) => res.json())
      .then((data) => setSiteStats(data))
      .catch((error) => console.error('Error fetching site stats:', error));

    // Fetch material groups
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materialGroups`)
      .then((res) => res.json())
      .then((data) => setMaterialGroups(data))
      .catch((error) => console.error('Error fetching material groups:', error));

    // Fetch featured products
    const fetchFeaturedProducts = async () => {
      try {
        const featuredDoc = await getDoc(doc(db, 'settings', 'featuredProducts'));
        if (featuredDoc.exists()) {
          setFeaturedProductIds(featuredDoc.data().productIds || []);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const handleStatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSiteStats((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSaveStats = async () => {
    try {
      // Use authenticated PUT for admin operations
      const response = await adminPut('/api/site-stats', siteStats);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update site stats');
      }
      alert('סטטיסטיקות עודכנו בהצלחה!');
    } catch (error: any) {
      console.error('Error updating site stats:', error);
      alert(error.message || 'שגיאה בעדכון הסטטיסטיקות');
    }
  };

  const handlePriceChange = (groupName: string, key: 'minPrice' | 'transportationPrice', value: number | null) => {
    setEditedPrices((prevPrices) => ({
      ...prevPrices,
      [groupName]: {
        ...prevPrices[groupName],
        [key]: value ?? undefined,
      },
    }));
  };

  const handleSaveMaterialGroupChanges = async () => {
    try {
      const updates = materialGroups.map(async (group) => {
        const updatedValues = editedPrices[group.groupName] || {};
        const minPrice = updatedValues.minPrice ?? group.minPrice;
        const transportationPrice = updatedValues.transportationPrice ?? group.transportationPrice;

        // Use authenticated PUT for admin operations
        const response = await adminPut('/api/materialGroups', {
          groupName: group.groupName,
          minPrice,
          transportationPrice,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to update ${group.groupName}`);
        }
      });

      await Promise.all(updates);
      alert('מחירים עודכנו בהצלחה!');

      // Refresh data (GET is public)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materialGroups`);
      const data = await response.json();
      setMaterialGroups(data);
      setEditedPrices({});
    } catch (error: any) {
      console.error('Error saving changes:', error);
      alert(error.message || 'שגיאה בעדכון המחירים');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMainCategories.length === 0) {
      alert('אנא סמן לפחות קטגוריה ראשית אחת.');
      return;
    }

    const selectedCategories = selectedMainCategories.map((mainCategoryName) => ({
      mainCategory: mainCategoryName,
      subCategories: selectedSubCategories[mainCategoryName] || [],
    }));

    let updatedProduct = {
      ...newProduct,
      מזהה: Number(newProduct.מזהה) || Math.floor(Math.random() * 100000),
      קטגוריות: selectedCategories,
      quantities: [...newProduct.quantities].sort((a, b) => a - b),
    };

    // Process image URL - upload to Cloudinary if it's external
    if (updatedProduct.תמונות && updatedProduct.תמונות.trim() !== '') {
      try {
        setUploading(true);
        const cloudinaryUrl = await processImageUrl(updatedProduct.תמונות);
        updatedProduct.תמונות = cloudinaryUrl;
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Image uploaded to Cloudinary:', cloudinaryUrl);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        alert('שגיאה בהעלאת התמונה. המוצר יישמר ללא תמונה.');
        updatedProduct.תמונות = '';
      } finally {
        setUploading(false);
      }
    }

    const categoriesString = updatedProduct.קטגוריות
      .map((category: any) => {
        const mainCategory = category.mainCategory;
        const subCategories = category.subCategories;
        return subCategories.length > 0
          ? subCategories.map((sub: string) => `${mainCategory} > ${sub}`).join(', ')
          : mainCategory;
      })
      .join(', ');

    updatedProduct.קטגוריות = categoriesString as any;

    if (Number(updatedProduct['מחיר מבצע']) === 0 || !updatedProduct['מחיר מבצע']) {
      delete (updatedProduct as any)['מחיר מבצע'];
    }

    if (updatedProduct.סוג === 'simple') {
      updatedProduct.variations = [];
      updatedProduct.attributes = [];
    } else if (updatedProduct.סוג === 'variable') {
      const attributeNames = updatedProduct.attributes.map((attr) => attr.name);
      const attributeValues = updatedProduct.attributes.map((attr) => attr.values);
      const variations = generateCombinations(attributeValues).map((combination) => {
        const attributes: any = {};
        let totalPrice = 0;

        combination.forEach((valueObj: any, i) => {
          attributes[attributeNames[i]] = {
            value: valueObj.value,
            price: valueObj.price,
          };
          totalPrice += Number(valueObj.price);
        });

        return {
          מזהה: Math.floor(Math.random() * 100000),
          סוג: 'variation',
          שם: `${updatedProduct.שם} - ${combination.map((val: any) => val.value).join(', ')}`,
          מחיר: totalPrice,
          'תיאור קצר': updatedProduct['תיאור קצר'],
          attributes,
        };
      });

      updatedProduct = { ...updatedProduct, variations };
    }

    if (isEditing) {
      dispatch(updateProduct(updatedProduct as any));
      setIsEditing(false);
    } else {
      dispatch(createProduct(updatedProduct as any));
    }

    setNewProduct(initialProductState);
    setSelectedMainCategories([]);
    setSelectedSubCategories({});
    setQuantityEnabled(false);
    setQuantityInput('');
    setShowForm(false);
  };

  const handleAddQuantity = () => {
    if (quantityInput && Number(quantityInput) > 0) {
      setNewProduct((prevProduct: any) => ({
        ...prevProduct,
        quantities: [...prevProduct.quantities, Number(quantityInput)],
      }));
      setQuantityInput('');
    }
  };

  const handleEdit = (product: any) => {
    // Ensure all required fields exist with defaults
    const productToEdit = {
      מזהה: product.מזהה || product._id || '',
      סוג: product.סוג || 'simple',
      'מק"ט': product['מק"ט'] || '',
      שם: product.שם || '',
      'תיאור קצר': product['תיאור קצר'] || '',
      תיאור: product.תיאור || '',
      'מחיר מבצע': product['מחיר מבצע'] || '',
      'מחיר רגיל': product['מחיר רגיל'] || '',
      קטגוריות: product.קטגוריות || '',
      תמונות: product.תמונות || '',
      materialGroup: product.materialGroup || '',
      variations: product.variations || [],
      attributes: product.attributes || [],
      quantities: product.quantities || [],
      allowComments: product.allowComments ?? false,
      ...product,  // Spread the rest of the product properties
    };

    // Convert variations to attributes format for the form
    // DB stores: variations: [{ attributes: { "AttrName": { value: "X", price: 100 } } }]
    // Form expects: attributes: [{ name: "AttrName", values: [{ value: "X", price: 100 }] }]
    if (productToEdit.סוג === 'variable' && productToEdit.variations && productToEdit.variations.length > 0) {
      const attributesMap: Record<string, { value: string; price: string }[]> = {};
      
      productToEdit.variations.forEach((variation: any) => {
        if (variation.attributes && typeof variation.attributes === 'object') {
          Object.entries(variation.attributes).forEach(([attrName, attrData]: [string, any]) => {
            if (!attributesMap[attrName]) {
              attributesMap[attrName] = [];
            }
            // Check if this value already exists (avoid duplicates)
            const existingValue = attributesMap[attrName].find(
              (v) => v.value === attrData.value
            );
            if (!existingValue) {
              attributesMap[attrName].push({
                value: attrData.value || '',
                price: String(attrData.price || ''),
              });
            }
          });
        }
      });

      // Convert map to array format
      const attributesArray = Object.entries(attributesMap).map(([name, values]) => ({
        name,
        values,
      }));

      if (attributesArray.length > 0) {
        productToEdit.attributes = attributesArray;
      }
    }

    // If it's a variable product but has no attributes, set default
    if (productToEdit.סוג === 'variable' && productToEdit.attributes.length === 0) {
      productToEdit.attributes = [{ name: '', values: [{ value: '', price: '' }] }];
    }

    setNewProduct(productToEdit);
    setIsEditing(true);
    setShowForm(true);

    // Parse categories back to selection format
    if (typeof product.קטגוריות === 'string') {
      const categoriesParts = product.קטגוריות.split(', ');
      const mainCats: string[] = [];
      const subCats: Record<string, string[]> = {};

      categoriesParts.forEach((cat: string) => {
        if (cat.includes(' > ')) {
          const [main, sub] = cat.split(' > ');
          if (!mainCats.includes(main)) mainCats.push(main);
          if (!subCats[main]) subCats[main] = [];
          subCats[main].push(sub);
        } else {
          if (!mainCats.includes(cat)) mainCats.push(cat);
        }
      });

      setSelectedMainCategories(mainCats);
      setSelectedSubCategories(subCats);
    }

    // Set quantity enabled if product has quantities
    if (productToEdit.quantities && productToEdit.quantities.length > 0) {
      setQuantityEnabled(true);
    }

    // Scroll to top smoothly so user can see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (productId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
      dispatch(deleteProduct(productId));
    }
  };

  const handleUploadCarouselImage = async () => {
    if (!carouselFile) return alert('אנא בחר תמונה');

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(carouselFile);
      await addDoc(collection(db, 'carouselImages'), { url: imageUrl });
      alert('התמונה נוספה בהצלחה!');
      setCarouselFile(null);
    } catch (error) {
      console.error('שגיאה בהעלאה:', error);
      alert('שגיאה בהעלאה');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAllCarouselImages = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל התמונות מהקרוסלה?')) return;

    try {
      const querySnapshot = await getDocs(collection(db, 'carouselImages'));
      const deletePromises = querySnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, 'carouselImages', docSnap.id))
      );
      await Promise.all(deletePromises);
      alert('כל התמונות נמחקו בהצלחה!');
    } catch (error) {
      console.error('שגיאה במחיקת תמונות:', error);
      alert('אירעה שגיאה בעת המחיקה.');
    }
  };

  const handleToggleFeaturedProduct = (productId: string) => {
    setFeaturedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSaveFeaturedProducts = async () => {
    try {
      await setDoc(doc(db, 'settings', 'featuredProducts'), {
        productIds: featuredProductIds,
        updatedAt: new Date().toISOString(),
      });
      alert('המוצרים המומלצים נשמרו בהצלחה!');
    } catch (error) {
      console.error('שגיאה בשמירת מוצרים מומלצים:', error);
      alert('שגיאה בשמירה');
    }
  };

  const handleClearFeaturedProducts = () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל המוצרים המומלצים?')) return;
    setFeaturedProductIds([]);
  };

  // Memoize filtered products for featured tab
  const filteredFeaturedProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (!featuredSearchQuery) return true;
        const query = featuredSearchQuery.toLowerCase();
        const name = String(product.שם || '').toLowerCase();
        const sku = String(product['מק"ט'] || '').toLowerCase();
        const id = String(product.מזהה || '').toLowerCase();
        return name.includes(query) || sku.includes(query) || id.includes(query);
      })
      .filter(
        (product) =>
          product['מחיר רגיל'] &&
          Number(product['מחיר רגיל']) > 0 &&
          product['תמונות'] &&
          String(product['תמונות']).trim() !== ''
      );
  }, [products, featuredSearchQuery]);

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'פאנל ניהול' }
  ];

  return (
      <main className="min-h-screen container mx-auto px-4 py-8 pt-32 md:pt-36" dir="rtl">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center">פאנל ניהול</h1>
        </header>

        {/* Tabs */}
        <nav aria-label="תפריט ניהול" className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            מוצרים
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            קטגוריות
          </button>
          <button
            onClick={() => setActiveTab('carousel')}
            className={`px-4 py-2 rounded ${activeTab === 'carousel' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            קרוסלה
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded ${activeTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            נתונים
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-4 py-2 rounded ${activeTab === 'shipping' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            מחירי משלוח
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-4 py-2 rounded ${activeTab === 'featured' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            מוצרים מומלצים
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`px-4 py-2 rounded ${activeTab === 'seo' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            תוכן SEO
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded ${activeTab === 'leads' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            פניות
          </button>
        </nav>

        {/* Leads Tab */}
        {activeTab === 'leads' && <LeadsManager />}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="חפש מוצר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border p-2 rounded"
              />
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setIsEditing(false);
                  setNewProduct(initialProductState);
                  setSelectedMainCategories([]);
                  setSelectedSubCategories({});
                  setQuantityEnabled(false);
                  setQuantityInput('');
                }}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                {showForm ? 'ביטול' : 'הוסף מוצר'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded mb-6">
                <h2 className="text-2xl font-bold mb-4">{isEditing ? 'ערוך מוצר' : 'הוסף מוצר חדש'}</h2>

                {/* Check if digital catalog */}
                {!newProduct.קטגוריות.includes('קטלוגים דיגיטלים להורדה') && (
                  <>
                    {/* Material Group */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">קבוצת חומרים:</label>
                      <select
                        name="materialGroup"
                        value={newProduct.materialGroup || ''}
                        onChange={(e) =>
                          setNewProduct((prev) => ({ ...prev, materialGroup: e.target.value }))
                        }
                        required
                        className="w-full border p-2 rounded"
                      >
                        <option value="">בחר קבוצת חומרים</option>
                        <option value="Colors and Accessories">צבעים ומוצרים נלווים</option>
                        <option value="Powders">אבקות (דבקים וטייח)</option>
                        <option value="Gypsum and Tracks">גבס ומסלולים</option>
                      </select>
                    </div>

                    {/* Product ID */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">מזהה:</label>
                      <input
                        type="text"
                        name="מזהה"
                        value={newProduct.מזהה}
                        onChange={(e) => handleInputChange(e, setNewProduct)}
                        required
                        className="w-full border p-2 rounded"
                      />
                    </div>

                    {/* Product Type */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">סוג:</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="סוג"
                            value="simple"
                            checked={newProduct.סוג === 'simple'}
                            onChange={(e) => handleRadioChange(e, setNewProduct)}
                          />
                          <span>Simple</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="סוג"
                            value="variable"
                            checked={newProduct.סוג === 'variable'}
                            onChange={(e) => handleRadioChange(e, setNewProduct)}
                          />
                          <span>Variable</span>
                        </label>
                      </div>
                    </div>

                    {/* Variable Product Attributes */}
                    {newProduct.סוג === 'variable' && (
                      <div className="mb-4 p-4 border rounded bg-white">
                        <h3 className="font-bold text-lg mb-3">מאפיינים</h3>
                        {newProduct.attributes.map((attribute: any, attrIndex: number) => (
                          <div key={attrIndex} className="mb-4 p-3 border rounded bg-gray-50">
                            <div className="mb-3">
                              <label className="block font-semibold mb-2">שם מאפיין:</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={attribute.name}
                                  onChange={(e) =>
                                    handleAttributeChange(attrIndex, e.target.value, setNewProduct)
                                  }
                                  required
                                  className="flex-1 border p-2 rounded"
                                  placeholder="לדוגמה: צבע, גודל"
                                />
                                {newProduct.attributes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttribute(attrIndex, setNewProduct)}
                                    className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                                  >
                                    הסר מאפיין
                                  </button>
                                )}
                              </div>
                            </div>

                            {attribute.values.map((valueObj: any, valueIndex: number) => (
                              <div key={valueIndex} className="flex gap-2 mb-2">
                                <div className="flex-1">
                                  <label className="block text-sm font-semibold mb-1">ערך מאפיין:</label>
                                  <input
                                    type="text"
                                    value={valueObj.value}
                                    onChange={(e) =>
                                      handleAttributeValueChange(
                                        attrIndex,
                                        valueIndex,
                                        'value',
                                        e.target.value,
                                        setNewProduct
                                      )
                                    }
                                    required
                                    className="w-full border p-2 rounded"
                                    placeholder="לדוגמה: אדום, L"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-sm font-semibold mb-1">מחיר מאפיין:</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={valueObj.price}
                                    onChange={(e) =>
                                      handleAttributeValueChange(
                                        attrIndex,
                                        valueIndex,
                                        'price',
                                        e.target.value,
                                        setNewProduct
                                      )
                                    }
                                    required
                                    className="w-full border p-2 rounded"
                                    placeholder="מחיר"
                                  />
                                </div>
                                {attribute.values.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveAttributeValue(attrIndex, valueIndex, setNewProduct)
                                    }
                                    className="self-end bg-red-400 text-white px-3 py-2 rounded hover:bg-red-500"
                                  >
                                    הסר
                                  </button>
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddAttributeValue(attrIndex, setNewProduct)}
                              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                              הוסף ערך מאפיין
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddAttribute(setNewProduct)}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          הוסף שם מאפיין
                        </button>
                      </div>
                    )}

                    {/* Quantity Options */}
                    <div className="mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={quantityEnabled}
                          onChange={() => setQuantityEnabled(!quantityEnabled)}
                        />
                        <span className="font-semibold">אופציה לכמות</span>
                      </label>
                    </div>

                    {quantityEnabled && (
                      <div className="mb-4 p-4 border rounded bg-white">
                        <div className="flex gap-2 mb-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="הכנס כמות"
                            value={quantityInput}
                            onChange={(e) => setQuantityInput(e.target.value)}
                            className="flex-1 border p-2 rounded"
                          />
                          <button
                            type="button"
                            onClick={handleAddQuantity}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                          >
                            הוסף כמות
                          </button>
                        </div>
                        <div className="mb-3">
                          <strong>כמויות: </strong>
                          {newProduct.quantities.length > 0
                            ? newProduct.quantities.join(', ')
                            : 'לא הוגדרו כמויות'}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNewProduct((prevState) => ({ ...prevState, quantities: [] }))
                          }
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                          איפוס כמות
                        </button>
                      </div>
                    )}

                    {/* Allow Comments */}
                    <div className="mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newProduct.allowComments}
                          onChange={() =>
                            setNewProduct((prev) => ({
                              ...prev,
                              allowComments: !prev.allowComments,
                            }))
                          }
                        />
                        <span className="font-semibold">פתח שדה הערות</span>
                      </label>
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block font-semibold mb-2">מחיר רגיל:</label>
                        <input
                          type="number"
                          name="מחיר רגיל"
                          value={newProduct['מחיר רגיל']}
                          onChange={(e) => handleInputChange(e, setNewProduct)}
                          className="w-full border p-2 rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">מחיר מבצע:</label>
                        <input
                          type="number"
                          name="מחיר מבצע"
                          value={newProduct['מחיר מבצע']}
                          onChange={(e) => handleInputChange(e, setNewProduct)}
                          className="w-full border p-2 rounded"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Fields that always appear */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-semibold mb-2">מק"ט:</label>
                    <input
                      type="text"
                      name='מק"ט'
                      value={newProduct['מק"ט']}
                      onChange={(e) => handleInputChange(e, setNewProduct)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">שם:</label>
                    <input
                      type="text"
                      name="שם"
                      value={newProduct.שם}
                      onChange={(e) => handleInputChange(e, setNewProduct)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block font-semibold mb-2">תיאור קצר:</label>
                  <textarea
                    name="תיאור קצר"
                    value={newProduct['תיאור קצר']}
                    onChange={(e) => handleInputChange(e, setNewProduct)}
                    className="w-full border p-2 rounded"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-semibold mb-2">תיאור (לינק לקטלוג):</label>
                  <textarea
                    name="תיאור"
                    value={newProduct.תיאור}
                    onChange={(e) => handleInputChange(e, setNewProduct)}
                    className="w-full border p-2 rounded"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-semibold mb-2 flex items-center gap-2">
                    תמונות:
                    <span className="relative group">
                      <span className="cursor-help text-blue-500 bg-blue-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold">?</span>
                      <span className="absolute right-0 top-6 w-72 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                        <strong className="block mb-1">איך להעתיק כתובת תמונה מגוגל:</strong>
                        1. לחץ <strong>שמאלי</strong> על התמונה (תיפתח בגדול)<br/>
                        2. לחץ <strong>ימני</strong> על התמונה הגדולה<br/>
                        3. בחר &quot;פתח תמונה בכרטיסייה חדשה&quot;<br/>
                        4. העתק את הכתובת מהכרטיסייה<br/>
                        <span className="text-green-300 block mt-1">✓ הכתובת צריכה להתחיל ב-https://</span>
                        <span className="text-red-300 block">✗ אל תלחץ ימני ישירות על התמונה הקטנה!</span>
                      </span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="תמונות"
                    value={newProduct.תמונות}
                    onChange={(e) => handleInputChange(e, setNewProduct)}
                    className="w-full border p-2 rounded"
                    placeholder="הדבק כתובת URL של תמונה (https://...)"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    💡 התמונה תועלה אוטומטית ל-Cloudinary בעת השמירה
                  </p>
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <h3 className="font-bold mb-2">בחר קטגוריות:</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {organizedCategories.map((category) => (
                      <div key={category.categoryName} className="border p-2 rounded bg-white">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedMainCategories.includes(category.categoryName)}
                            onChange={() => {
                              const isChecked = selectedMainCategories.includes(category.categoryName);
                              if (isChecked) {
                                setSelectedMainCategories(
                                  selectedMainCategories.filter((c) => c !== category.categoryName)
                                );
                                const { [category.categoryName]: _, ...rest } = selectedSubCategories;
                                setSelectedSubCategories(rest);
                              } else {
                                setSelectedMainCategories([...selectedMainCategories, category.categoryName]);
                              }
                            }}
                          />
                          <span className="font-semibold">{category.categoryName}</span>
                        </label>
                        {selectedMainCategories.includes(category.categoryName) &&
                          category.subCategories && (
                            <div className="mr-6 mt-2 space-y-1">
                              {category.subCategories.map((sub: any) => (
                                <label key={sub.subCategoryName} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      (selectedSubCategories[category.categoryName] || []).includes(
                                        sub.subCategoryName
                                      )
                                    }
                                    onChange={() => {
                                      const current = selectedSubCategories[category.categoryName] || [];
                                      const isChecked = current.includes(sub.subCategoryName);
                                      setSelectedSubCategories({
                                        ...selectedSubCategories,
                                        [category.categoryName]: isChecked
                                          ? current.filter((s) => s !== sub.subCategoryName)
                                          : [...current, sub.subCategoryName],
                                      });
                                    }}
                                  />
                                  <span>{sub.subCategoryName}</span>
                                </label>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold text-lg"
                >
                  {isEditing ? 'שמור שינויים' : 'שמור מוצר'}
                </button>
              </form>
            )}

            {/* Products List */}
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="border p-4 rounded bg-white flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{product.שם}</h3>
                    <p className="text-sm text-gray-600">מזהה: {product.מזהה}</p>
                    <p className="text-sm">מחיר: ₪{product['מחיר רגיל']}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">ניהול תמונות קטגוריות</h2>
            <CategoryImageManager organizedCategories={organizedCategories} />
          </div>
        )}

        {/* Carousel Tab */}
        {activeTab === 'carousel' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">ניהול קרוסלה</h2>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCarouselFile(e.target.files?.[0] || null)}
                className="border p-2 rounded w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUploadCarouselImage}
                  disabled={!carouselFile || uploading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? 'מעלה...' : 'העלה תמונה'}
                </button>
                <button
                  onClick={handleDeleteAllCarouselImages}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                  מחק את כל התמונות
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">ניהול סטטיסטיקות דף הבית</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-right font-semibold mb-2">לקוחות מרוצים:</label>
                <input
                  type="number"
                  name="clients"
                  value={siteStats.clients}
                  onChange={handleStatsChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-right font-semibold mb-2">נקודות אספקה:</label>
                <input
                  type="number"
                  name="supplyPoints"
                  value={siteStats.supplyPoints}
                  onChange={handleStatsChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-right font-semibold mb-2">מחוברים כרגע:</label>
                <input
                  type="number"
                  name="onlineUsers"
                  value={siteStats.onlineUsers}
                  onChange={handleStatsChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-right font-semibold mb-2">דקות מההזמנה האחרונה:</label>
                <input
                  type="number"
                  name="lastOrderMinutes"
                  value={siteStats.lastOrderMinutes}
                  onChange={handleStatsChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <button
              onClick={handleSaveStats}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              שמור סטטיסטיקות
            </button>
          </div>
        )}

        {/* Shipping/Material Groups Tab */}
        {activeTab === 'shipping' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">ניהול מחירי משלוח וקבוצות חומרים</h2>
            <table className="min-w-full table-auto text-right border border-gray-300 bg-white">
              <thead className="bg-orange-100 text-orange-800">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-300 font-semibold text-xl">שם הקבוצה</th>
                  <th className="px-6 py-3 border-b border-gray-300 font-semibold text-xl">מחיר מינימום נוכחי</th>
                  <th className="px-6 py-3 border-b border-gray-300 font-semibold text-xl">מחיר הובלה</th>
                  <th className="px-6 py-3 border-b border-gray-300 font-semibold text-xl">עדכן מחיר מינימום ומחיר הובלה</th>
                </tr>
              </thead>
              <tbody>
                {materialGroups.map((group, index) => (
                  <tr key={group.groupName} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4 border-b border-gray-200">
                      {group.groupName === 'Colors and Accessories' && 'צבעים ומוצרים נלווים'}
                      {group.groupName === 'Powders' && 'אבקות (דבקים וטייח)'}
                      {group.groupName === 'Gypsum and Tracks' && 'גבס ומסלולים'}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">{group.minPrice}₪</td>
                    <td className="px-6 py-4 border-b border-gray-200">{group.transportationPrice}₪</td>
                    <td className="px-6 py-4 border-b border-gray-200 space-y-2">
                      <input
                        type="number"
                        className="w-28 px-2 m-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={editedPrices[group.groupName]?.minPrice ?? group.minPrice}
                        onChange={(e) =>
                          handlePriceChange(
                            group.groupName,
                            'minPrice',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        placeholder="מחיר מינימום"
                      />
                      <input
                        type="number"
                        className="w-28 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={editedPrices[group.groupName]?.transportationPrice ?? group.transportationPrice}
                        onChange={(e) =>
                          handlePriceChange(
                            group.groupName,
                            'transportationPrice',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        placeholder="מחיר הובלה"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={handleSaveMaterialGroupChanges}
              className="mt-4 bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 font-bold text-xl"
            >
              עדכן מחירים
            </button>
          </div>
        )}

        {/* Featured Products Tab */}
        {activeTab === 'featured' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">ניהול מוצרים מומלצים</h2>
            <p className="text-gray-600 mb-4">
              בחר את המוצרים שיוצגו בדף הבית תחת "מוצרים מומלצים". אם למשתמש יש מוצרים בהנחה, הם יוצגו במקום.
            </p>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="חפש מוצר..."
                value={featuredSearchQuery}
                onChange={(e) => setFeaturedSearchQuery(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={handleSaveFeaturedProducts}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                שמור מוצרים מומלצים
              </button>
              <button
                onClick={handleClearFeaturedProducts}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
              >
                נקה הכל
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>נבחרו: {featuredProductIds.length} מוצרים</span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded p-4">
              <div className="space-y-2">
                {filteredFeaturedProducts.map((product) => (
                    <label
                      key={product._id}
                      className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={featuredProductIds.includes(product._id)}
                        onChange={() => handleToggleFeaturedProduct(product._id)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{product.שם}</div>
                        <div className="text-sm text-gray-600">
                          מק"ט: {product['מק"ט']} | מחיר: ₪{product['מחיר רגיל']}
                        </div>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* SEO Content Tab */}
        {activeTab === 'seo' && (
          <CategorySeoTextManager />
        )}
      </main>
  );
}
