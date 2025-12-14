export const generateCombinations = (arrays: any[][]): any[][] => {
  if (arrays.length === 0) return [[]];
  const firstArray = arrays[0];
  const restArrays = generateCombinations(arrays.slice(1));
  const combinations: any[][] = [];
  firstArray.forEach((value) => {
    restArrays.forEach((rest) => {
      combinations.push([value, ...rest]);
    });
  });
  return combinations;
};

export const fetchCategories = (categories: any) => {
  if (categories?.categories?.companyCategories) {
    return Object.values(categories.categories.companyCategories).map(
      (category: any) => ({
        categoryName: category.categoryName,
        subCategories: category.subCategories.map((subCategory: any) => ({
          subCategoryName: subCategory.subCategoryName,
        })),
      })
    );
  }
  return [];
};

export const handleSearch = (query: string, products: any[]) => {
  if (query) {
    const lowerCaseQuery = query.toLowerCase();

    return products.filter((product) => {
      const id = product.מזהה ? String(product.מזהה).toLowerCase() : '';
      const sku = product['מק"ט'] ? String(product['מק"ט']).toLowerCase() : '';
      const name = product.שם ? String(product.שם).toLowerCase() : '';

      return (
        id.includes(lowerCaseQuery) ||
        sku.includes(lowerCaseQuery) ||
        name.includes(lowerCaseQuery)
      );
    });
  } else {
    return products;
  }
};

export const handleMainCategoryChange = (
  categoryName: string,
  setSelectedMainCategories: React.Dispatch<React.SetStateAction<string[]>>,
  selectedSubCategories: Record<string, string[]>,
  setSelectedSubCategories: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
) => {
  setSelectedMainCategories((prevSelected) => {
    const alreadySelected = prevSelected.includes(categoryName);
    if (alreadySelected) {
      const updated = prevSelected.filter((name) => name !== categoryName);
      const { [categoryName]: _, ...rest } = selectedSubCategories;
      setSelectedSubCategories(rest);
      return updated;
    } else {
      return [...prevSelected, categoryName];
    }
  });
};

export const handleSubCategoryChange = (
  mainCategoryName: string,
  subCategoryName: string,
  selectedSubCategories: Record<string, string[]>,
  setSelectedSubCategories: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
) => {
  setSelectedSubCategories((prevSelected) => {
    const subCategoriesForMain = prevSelected[mainCategoryName] || [];
    const alreadySelected = subCategoriesForMain.includes(subCategoryName);
    const updatedSubCategories = alreadySelected
      ? subCategoriesForMain.filter((name) => name !== subCategoryName)
      : [...subCategoriesForMain, subCategoryName];

    return {
      ...prevSelected,
      [mainCategoryName]: updatedSubCategories,
    };
  });
};

export const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setNewProduct: React.Dispatch<React.SetStateAction<any>>
) => {
  const { name, value } = e.target;
  setNewProduct((prevProduct: any) => ({
    ...prevProduct,
    [name]: value,
  }));
};

export const handleRadioChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setNewProduct: React.Dispatch<React.SetStateAction<any>>
) => {
  const newType = e.target.value;
  setNewProduct((prevProduct: any) => ({
    ...prevProduct,
    סוג: newType,
    variations: [],
    attributes: newType === 'variable' ? [{ name: '', values: [{ value: '', price: '' }] }] : [],
  }));
};

export const handleAttributeChange = (
  index: number,
  value: string,
  setNewProduct: React.Dispatch<React.SetStateAction<any>>
) => {
  setNewProduct((prevProduct: any) => {
    const updatedAttributes = [...prevProduct.attributes];
    updatedAttributes[index].name = value;
    return { ...prevProduct, attributes: updatedAttributes };
  });
};

export const handleAttributeValueChange = (
  attrIndex: number,
  valueIndex: number,
  field: 'value' | 'price',
  value: string,
  setNewProduct: React.Dispatch<React.SetStateAction<any>>
) => {
  setNewProduct((prevProduct: any) => {
    const updatedAttributes = [...prevProduct.attributes];
    updatedAttributes[attrIndex].values[valueIndex][field] = value;
    return { ...prevProduct, attributes: updatedAttributes };
  });
};

export const handleAddAttribute = (setNewProduct: React.Dispatch<React.SetStateAction<any>>) => {
  setNewProduct((prevProduct: any) => ({
    ...prevProduct,
    attributes: [...prevProduct.attributes, { name: '', values: [{ value: '', price: '' }] }],
  }));
};

export const handleAddAttributeValue = (
  attrIndex: number,
  setNewProduct: React.Dispatch<React.SetStateAction<any>>
) => {
  setNewProduct((prevProduct: any) => {
    const updatedAttributes = [...prevProduct.attributes];
    updatedAttributes[attrIndex].values.push({ value: '', price: '' });
    return { ...prevProduct, attributes: updatedAttributes };
  });
};

export const handleRemoveAttribute = (
  attrIndex: number,
  setNewProduct: React.Dispatch<React.SetStateAction<any>>
) => {
  setNewProduct((prevProduct: any) => {
    const updatedAttributes = prevProduct.attributes.filter((_: any, i: number) => i !== attrIndex);
    return { ...prevProduct, attributes: updatedAttributes };
  });
};

export const handleRemoveAttributeValue = (
  attrIndex: number,
  valueIndex: number,
  setNewProduct: React.Dispatch<React.SetStateAction<any>>
) => {
  setNewProduct((prevProduct: any) => {
    const updatedAttributes = [...prevProduct.attributes];
    updatedAttributes[attrIndex].values = updatedAttributes[attrIndex].values.filter(
      (_: any, i: number) => i !== valueIndex
    );
    return { ...prevProduct, attributes: updatedAttributes };
  });
};
