// telegram-service.js
const TelegramService = {
    BOT_TOKEN: '7995086363:AAHAonpRf69e1avVPq9_rJqToTsuPRSxnf4',
    CHANNEL_ID: '-1003314026322',
    
    // Вспомогательные функции для форматирования
    formatMonth: function(month) {
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return months[month];
    },
    
    numberToWords: function(number) {
        const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
        const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 
                      'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
        const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
        const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
        
        let num = parseInt(number);
        if (isNaN(num) || num <= 0) return 'ноль';
        
        let result = '';
        
        // Тысячи
        if (num >= 1000) {
            const thousands = Math.floor(num / 1000);
            if (thousands === 1) {
                result += 'одна тысяча ';
            } else if (thousands >= 2 && thousands <= 4) {
                result += this.numberToWords(thousands) + ' тысячи ';
            } else {
                result += this.numberToWords(thousands) + ' тысяч ';
            }
            num %= 1000;
        }
        
        // Сотни
        if (num >= 100) {
            result += hundreds[Math.floor(num / 100)] + ' ';
            num %= 100;
        }
        
        // Десятки и единицы
        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        } else if (num >= 10) {
            result += teens[num - 10] + ' ';
            num = 0;
        }
        
        // Единицы
        if (num > 0) {
            result += units[num] + ' ';
        }
        
        return result.trim();
    },
    
    // Отправка заказа в Telegram
    sendOrder: async function(orderData) {
        const { state, categoriesConfig, modelsConfig } = orderData;
        
        const telegramMessage = `
🎯 *НОВЫЙ ЗАКАЗ 3D-МОДЕЛИ*

👤 *Клиент:* ${state.customerName}
📞 *Контакты:* ${state.customerContact}

📋 *Детали заказа:*
┌─────────────────────
├ Тип: ${state.projectType === 'individual' ? 'Индивидуальная модель (стандартная цена)' : 'Готовая модель (скидка 50%)'}
├ Категория: ${this.getCategoryName(state, categoriesConfig)}
├ Модель: ${this.getModelName(state, modelsConfig)}
├ Пол: ${state.selectedGender === 'male' ? 'Мужской' : 'Женский'}
├ Высота: ${state.height} см
├ Срок: ${this.calculateFinalDays(state)} дней
├ Эксклюзив: ${state.exclusive ? '✅ ДА (+60%)' : '❌ НЕТ'}
├ Печать: ${state.printing ? '✅ ДА' : '❌ НЕТ'}
├ Покраска: ${state.painting ? '✅ ДА' : '❌ НЕТ'}
├ Фото: ${state.uploadedPhoto ? '✅ Загружено' : '❌ Нет фото'}
└─────────────────────

💰 *Стоимость:* ${this.calculatePrice(state, categoriesConfig).toLocaleString()} руб.

💬 *Комментарий:* ${state.comment || 'Нет комментария'}

🆔 *ID заказа:* ${Date.now().toString().slice(-8)}
        `.trim();
        
        try {
            // Отправка текстового сообщения в канал
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.CHANNEL_ID,
                    text: telegramMessage,
                    parse_mode: 'Markdown'
                })
            });
            
            const result = await response.json();
            
            // Если есть фото, отправляем его отдельно
            if (state.uploadedPhoto) {
                await this.sendPhoto(state.uploadedPhoto, state.customerName);
            }
            
            return result;
            
        } catch (error) {
            console.error('Ошибка отправки заказа в Telegram:', error);
            throw error;
        }
    },
    
    // Отправка фото в Telegram
    sendPhoto: async function(photoBase64, customerName) {
        try {
            const photoBlob = await fetch(photoBase64).then(r => r.blob());
            const formData = new FormData();
            formData.append('chat_id', this.CHANNEL_ID);
            formData.append('photo', photoBlob, 'customer_photo.jpg');
            formData.append('caption', `📸 Фото от клиента: ${customerName}`);
            
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка отправки фото в Telegram:', error);
        }
    },
    
    // Отправка договора в Telegram
    sendContract: async function(contractText, customerName, customerContact, price) {
        try {
            const formData = new FormData();
            formData.append('chat_id', this.CHANNEL_ID);
            formData.append('document', new Blob([contractText], { type: 'text/plain' }), 
                `Договор_${customerName}_${Date.now().toString().slice(-6)}.txt`);
            formData.append('caption', `📄 ДОГОВОР ОТ КЛИЕНТА\n👤 ${customerName}\n📞 ${customerContact}\n💰 ${price.toLocaleString()} руб.`);
            
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendDocument`, {
                method: 'POST',
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка отправки договора в Telegram:', error);
            throw error;
        }
    },
    
    // Вспомогательные методы для расчета
    calculatePrice: function(state, categoriesConfig) {
        if (!state.selectedCategory || !state.selectedGender) return 0;
        
        const category = categoriesConfig[state.selectedGender].find(cat => cat.id === state.selectedCategory);
        if (!category) return 0;
        
        let base = category.basePrice;
        
        if (state.projectType === 'ready' && !category.noDiscount) {
            base = Math.round(base * 0.5);
        }
        
        let total = base;

        if (['15', '18'].includes(state.height)) total = Math.round(total * 1.15);
        else if (['20', '25'].includes(state.height)) total = Math.round(total * 1.25);

        if (state.baseDays === '7') total = Math.round(total * 1.1);
        else if (state.baseDays === '3') total = Math.round(total * 1.2);

        if (state.exclusive) total = Math.round(total * 1.6);

        // Печать
        if (state.printing) {
            if (state.height === '10') total += 2500;
            else if (['15', '18'].includes(state.height)) total += 4000;
            else total += 5500;
        }

        // Покраска
        if (state.painting) {
            if (state.height === '10') total += 7000;
            else if (['15', '18'].includes(state.height)) total += 10000;
            else total += 12000;
        }

        return total;
    },
    
    calculateFinalDays: function(state) {
        let days = parseInt(state.baseDays);
        if (state.printing) days += 14;
        if (state.painting) days += 14;
        return days;
    },
    
    getCategoryName: function(state, categoriesConfig) {
        const category = categoriesConfig[state.selectedGender]?.find(cat => cat.id === state.selectedCategory);
        return category?.name || '—';
    },
    
    getModelName: function(state, modelsConfig) {
        if (state.projectType === 'individual') {
            return 'Индивидуальная модель';
        } else {
            const models = modelsConfig[state.selectedCategory]?.[state.selectedGender] || [];
            const model = models.find(m => m.id === state.selectedModel);
            return model?.name || 'Модель не выбрана';
        }
    }
};