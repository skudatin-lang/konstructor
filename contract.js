function numberToWords(n) {
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
    
    let result = '';
    let num = Math.floor(n);
    
    if (num === 0) return 'ноль';
    
    if (num >= 100) {
        result += hundreds[Math.floor(num / 100)] + ' ';
        num %= 100;
    }
    
    if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
    } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        num = 0;
    }
    
    if (num > 0) {
        result += units[num] + ' ';
    }
    
    return result.trim() + ' рублей';
}

function getMonthName(m) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return months[m];
}

function generateContractText() {
    const category = cachedData.categories[currentState.selectedGender]?.find(c => c.id === currentState.selectedCategory);
    const price = calculatePrice(currentState, category, cachedData.pricing).total;
    const now = new Date();
    const day = now.getDate();
    const month = getMonthName(now.getMonth());
    const year = now.getFullYear();
    const finalDays = calculateFinalDays(currentState);
    
    const priceWords = numberToWords(price);
    
    const contractText = `
ДОГОВОР-ОФЕРТА №${Date.now().toString().slice(-6)}
г. Москва ${day} ${month} ${year} г.

Исполнитель: ${currentState.customerName}
Заказчик: 3D-моделирование

1. ПРЕДМЕТ ДОГОВОРА
1.1. Исполнитель обязуется выполнить работы по созданию 3D-модели, а Заказчик обязуется принять и оплатить выполненные работы.

2. СТОИМОСТЬ И ПОРЯДОК РАСЧЕТОВ
2.1. Стоимость работ составляет ${price.toLocaleString()} (${priceWords}).
2.2. Оплата производится в полном объеме до начала работ.

3. СРОКИ ВЫПОЛНЕНИЯ РАБОТ
3.1. Срок выполнения работ: ${finalDays} календарных дней с момента оплаты.

4. ТЕХНИЧЕСКОЕ ЗАДАНИЕ
4.1. Тип модели: ${currentState.projectType === 'individual' ? 'Индивидуальная' : 'Готовая'}
4.2. Категория: ${category?.name || '---'}
4.3. Высота модели: ${currentState.height} см
4.4. Дополнительные услуги:
    - Эксклюзивные права: ${currentState.exclusive ? 'Да' : 'Нет'}
    - Печать модели: ${currentState.printing ? 'Да' : 'Нет'}
    - Покраска модели: ${currentState.painting ? 'Да' : 'Нет'}

5. ГАРАНТИИ
5.1. Исполнитель гарантирует соответствие выполненной работы техническому заданию.

6. ПОДПИСИ СТОРОН
Исполнитель: _________________ ${currentState.customerName}
Заказчик: _________________ 3D-моделирование
    `.trim();
    
    return contractText;
}

function showContractScreen() {
    const category = cachedData.categories[currentState.selectedGender]?.find(c => c.id === currentState.selectedCategory);
    const price = calculatePrice(currentState, category, cachedData.pricing).total;
    
    document.getElementById('contractScreen').innerHTML = `
        <div class="contract-container">
            <div class="contract-header"><h1>ДОГОВОР-ОФЕРТА</h1><h2>Спасибо за заказ!</h2></div>
            <div class="project-info">
                <strong>Детали заказа:</strong><br>
                • Тип: ${currentState.projectType === 'individual' ? 'Индивидуальная' : 'Готовая'}<br>
                • Категория: ${category?.name || '---'}<br>
                • Стоимость: ${price.toLocaleString()} ₽
            </div>
            <div style="text-align:center;margin-top:30px;">
                <p>Договор отправлен в Telegram.</p>
                <button class="btn" onclick="window.print()"><i class="fas fa-print"></i> Распечатать</button>
                <button class="btn btn-secondary" onclick="location.reload()"><i class="fas fa-plus"></i> Новый заказ</button>
            </div>
        </div>
    `;
    
    showScreen('contractScreen');
    updateProgressBar(6);
}

async function submitOrderFromForm() {
    const name = document.getElementById('name').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const agree = document.getElementById('agree').checked;
    const comment = document.getElementById('comment').value.trim();
    
    if (!agree || !name || !contact || !currentState.selectedModel || currentState.uploadedPhotos.length === 0) {
        alert('Проверьте все поля и загрузите фото');
        return;
    }
    
    currentState.customerName = name;
    currentState.customerContact = contact;
    currentState.comment = comment;
    
    try {
        const category = cachedData.categories[currentState.selectedGender].find(c => c.id === currentState.selectedCategory);
        let modelName = 'Индивидуальная модель';
        
        if (currentState.projectType !== 'individual') {
            const model = getAvailableModels().find(m => m.id === currentState.selectedModel);
            modelName = model?.name || '---';
        }
        
        await sendOrderToTelegram(currentState, category, modelName, cachedData.pricing, currentState.uploadedPhotos);
        await sendContractToTelegram(generateContractText());
        showContractScreen();
    } catch (e) {
        console.error(e);
        alert('Ошибка отправки, но договор сформирован');
        showContractScreen();
    }
}