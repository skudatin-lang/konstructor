async function loadSheetData(sheetName) {
    const url = `${window.APP_CONFIG.WEB_APP_URL}?sheet=${encodeURIComponent(sheetName)}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status} ${res.statusText}`);
    
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data.error) throw new Error(data.error);
    throw new Error("Некорректный формат ответа от Google Apps Script");
}

async function loadAllData() {
    const [categories, models, pricing] = await Promise.all([
        loadSheetData('categories'),
        loadSheetData('models'),
        loadSheetData('pricing')
    ]);

    // Группировка categories
    const categoriesByGender = { male: [], female: [] };
    categories.forEach(cat => {
        const item = {
            id: cat.id,
            name: cat.name,
            gender: cat.gender,
            description: cat.description || '',
            imageUrl: cat.imageUrl || '',
            basePrice: Number(cat.basePrice) || 0,
            availableFor: (cat.availableFor || '').toString().split(',').map(s => s.trim()).filter(Boolean),
            noDiscount: cat.noDiscount === true || cat.noDiscount === 'TRUE'
        };
        
        if (item.gender === 'male') categoriesByGender.male.push(item);
        else if (item.gender === 'female') categoriesByGender.female.push(item);
    });

    // Группировка models
    const modelsMap = {};
    models.forEach(m => {
        if (!modelsMap[m.category]) modelsMap[m.category] = {};
        if (!modelsMap[m.category][m.gender]) modelsMap[m.category][m.gender] = [];
        
        modelsMap[m.category][m.gender].push({
            id: m.id,
            name: m.name,
            category: m.category,
            gender: m.gender,
            description: m.description || '',
            style: m.style || '',
            imageUrl: m.imageUrl || ''
        });
    });

    // Группировка pricing
    const pricingMap = {};
    pricing.forEach(row => {
        const group = row.group;
        const key = row.key;
        if (!group || !key) return;
        
        if (!pricingMap[group]) pricingMap[group] = {};
        pricingMap[group][key] = {
            value: Number(row.value) || 0,
            type: (row.valueType || 'fixed').toLowerCase(),
            description: row.description || ''
        };
    });

    return { categories: categoriesByGender, models: modelsMap, pricing: pricingMap };
}