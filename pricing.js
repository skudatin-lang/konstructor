// pricing.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

function calculatePrice(state, category, pricing) {
    if (!category || typeof category.basePrice !== 'number') return { 
        total: 0, 
        base: 0, 
        printing: 0, 
        painting: 0,
        heightMarkup: 0,
        daysMarkup: 0,
        exclusiveMarkup: 0,
        discount: 0
    };

    // 1. Базовая цена категории
    let basePrice = Number(category.basePrice);
    
    // 2. Инициализируем компоненты
    let discount = 0;
    let heightMarkup = 0;
    let daysMarkup = 0;
    let exclusiveMarkup = 0;
    let printingCost = 0;
    let paintingCost = 0;
    
    // 3. СКИДКА на готовую модель (только если категория не noDiscount)
    if (state.projectType === 'ready' && !category.noDiscount) {
        const disc = pricing.discount?.ready_model;
        if (disc && disc.type === 'percent') {
            discount = Math.round(basePrice * disc.value / 100);
        }
    }
    
    // 4. НАДБАВКИ (все от БАЗОВОЙ цены, не от цены со скидкой!)
    
    // Надбавка за высоту
    const hRule = pricing.height_markup?.[state.height];
    if (hRule) {
        if (hRule.type === 'percent') {
            heightMarkup = Math.round(basePrice * hRule.value / 100);
        } else if (hRule.type === 'fixed') {
            heightMarkup = hRule.value;
        }
    }
    
    // Надбавка за срок
    const dRule = pricing.days_markup?.[state.baseDays];
    if (dRule) {
        if (dRule.type === 'percent') {
            daysMarkup = Math.round(basePrice * dRule.value / 100);
        } else if (dRule.type === 'fixed') {
            daysMarkup = dRule.value;
        }
    }
    
    // Надбавка за эксклюзив
    if (state.exclusive) {
        const eRule = pricing.exclusive?.multiplier;
        if (eRule) {
            if (eRule.type === 'percent') {
                exclusiveMarkup = Math.round(basePrice * eRule.value / 100);
            } else if (eRule.type === 'fixed') {
                exclusiveMarkup = eRule.value;
            }
        }
    }
    
    // 5. ФИКСИРОВАННЫЕ услуги (не влияют на проценты)
    
    // Печать
    const printRule = pricing.printing?.[state.height];
    if (state.printing && printRule && printRule.type === 'fixed') {
        printingCost = printRule.value;
    }
    
    // Покраска
    const paintRule = pricing.painting?.[state.height];
    if (state.painting && paintRule && paintRule.type === 'fixed') {
        paintingCost = paintRule.value;
    }
    
    // 6. ИТОГОВЫЙ РАСЧЕТ
    const total = basePrice - discount + heightMarkup + daysMarkup + exclusiveMarkup + printingCost + paintingCost;
    
    return {
        total: Math.max(0, total), // Не может быть отрицательным
        base: basePrice,
        discount: discount,
        heightMarkup: heightMarkup,
        daysMarkup: daysMarkup,
        exclusiveMarkup: exclusiveMarkup,
        printing: printingCost,
        painting: paintingCost
    };
}

function calculateFinalDays(state) {
    let days = parseInt(state.baseDays) || 14;
    if (state.printing) days += 14;
    if (state.painting) days += 14;
    return days;
}