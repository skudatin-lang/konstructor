// contract-generator.js
const ContractGenerator = {
    // Генерация текста договора
    generate: function(orderData) {
        const { state, categoriesConfig, modelsConfig } = orderData;
        
        const price = this.calculatePrice(state, categoriesConfig);
        const now = new Date();
        const day = now.getDate();
        const month = this.formatMonth(now.getMonth());
        const year = now.getFullYear();
        
        const baseDays = parseInt(state.baseDays);
        const stage2Duration = Math.max(2, Math.ceil(baseDays * 0.4));
        const stage3Duration = Math.max(3, Math.ceil(baseDays * 0.6));
        
        // Расчет дополнительных услуг
        let printingCost = 0;
        let paintingCost = 0;
        
        if (state.printing) {
            if (state.height === '10') printingCost = 2500;
            else if (['15', '18'].includes(state.height)) printingCost = 4000;
            else printingCost = 5500;
        }
        
        if (state.painting) {
            if (state.height === '10') paintingCost = 7000;
            else if (['15', '18'].includes(state.height)) paintingCost = 10000;
            else paintingCost = 12000;
        }
        
        const stage1Cost = Math.round(price * 0.2);
        const stage2Cost = Math.round(price * 0.3);
        const stage3Cost = price - stage1Cost - stage2Cost;
        
        const category = categoriesConfig[state.selectedGender]?.find(cat => cat.id === state.selectedCategory);
        
        // Определяем название модели
        let modelName = '';
        let projectName = '';
        
        if (state.projectType === 'individual') {
            modelName = 'Индивидуальная модель';
            projectName = `Индивидуальная 3D модель: ${state.selectedGender === 'male' ? 'Мужская' : 'Женская'} ${category?.name}`;
        } else {
            const models = modelsConfig[state.selectedCategory]?.[state.selectedGender] || [];
            const model = models.find(m => m.id === state.selectedModel);
            modelName = model?.name || 'Модель не выбрана';
            projectName = `3D модель по фото: ${modelName}`;
        }
        
        // Генерация договора
        return this.generateContractText({
            date: { day, month, year },
            customer: state.customerName,
            contact: state.customerContact,
            price,
            stage1Cost,
            stage2Cost,
            stage3Cost,
            stage2Duration,
            stage3Duration,
            projectType: state.projectType,
            category,
            modelName,
            projectName,
            height: state.height,
            baseDays,
            finalDays: this.calculateFinalDays(state),
            exclusive: state.exclusive,
            printing: state.printing,
            painting: state.painting,
            printingCost,
            paintingCost,
            comment: state.comment,
            uploadedPhoto: state.uploadedPhoto
        });
    },
    
    // Форматирование месяца
    formatMonth: function(month) {
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return months[month];
    },
    
    // Число прописью
    numberToWords: function(number) {
        const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
        const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 
                      'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
        const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
        const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
        
        let num = parseInt(number);
        if (isNaN(num) || num <= 0) return 'ноль';
        
        let result = '';
        
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
        
        return result.trim();
    },
    
    // Расчет стоимости
    calculatePrice: function(state, categoriesConfig) {
        // Дублируем логику расчета из основного файла
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

        if (state.printing) {
            if (state.height === '10') total += 2500;
            else if (['15', '18'].includes(state.height)) total += 4000;
            else total += 5500;
        }

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
    
    // Генерация текста договора
    generateContractText: function(data) {
        const contractText = `
ДОГОВОР-ОФЕРТА
на оказание услуг по созданию 3D-модели

г. Москва «${data.date.day}» ${data.date.month} ${data.date.year} г.

Исполнитель: Константин Сергеевич С., предлагает заключить настоящий Договор любому лицу (далее — «Заказчик»).

1. ПРЕДМЕТ ДОГОВОРА
1.1. Исполнитель обязуется создать 3D-модель в соответствии с Техническим заданием (ТЗ), являющимся неотъемлемой частью настоящего Договора, а Заказчик обязуется принять и оплатить работу.

${data.projectType === 'individual' ? `
1.2. При выборе услуги «Индивидуальная модель по фото» Заказчик предоставляет изображение, соответствующее следующим требованиям:
— чёткое, без размытия или сильного сжатия;
— лицо в 3/4, без сильных теней, бликов или яркого контрового света;
— в кадре присутствует только один человек.
Если предоставленное изображение не соответствует указанным критериям, Исполнитель вправе в течение 24 часов с момента оплаты расторгнуть Договор и вернуть предоплату в полном объёме без удержаний.
` : `
1.2. При выборе услуги «Готовая модель с лицом по фото» Заказчик предоставляет изображение лица для переноса на выбранную модель.
`}

2. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ
2.1. Цена Договора составляет ${data.price} (${this.numberToWords(data.price.toString())}) рублей.

2.2. ${data.projectType === 'individual' ? 
    'Выбрана услуга «Индивидуальная модель по фото» по стандартной цене.' : 
    data.category?.noDiscount ? 
    'Выбрана бюджетная категория «Модели от 990₽» без скидки.' : 
    'Выбрана услуга «Готовая модель с лицом по фото» со скидкой 50% от стандартной цены.'}

2.3. Оплата производится в три этапа:
• Этап 1 (20%): ${data.stage1Cost} руб. – оплата до начала работ. Является подтверждением акцепта данной оферты.
• Этап 2 (30%): ${data.stage2Cost} руб. – оплачивается одновременно с Этапом 1.
• Этап 3 (50%): ${data.stage3Cost} руб. – оплата в течение 2 рабочих дней с момента утверждения 3D-эскиза.

${data.printing || data.painting ? `
4. ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ (АГЕНТИРОВАНИЕ)
4.1. Исполнитель действует в качестве Агента Заказчика по организации услуг 3D-печати и покраски финальной модели силами третьих лиц (Подрядчиков).

${data.printing ? `• Услуга печати: ${data.printingCost} руб. (прямые расходы) + 20% агентское вознаграждение (${Math.round(data.printingCost * 0.2)} руб.) = ${Math.round(data.printingCost * 1.2)} руб. (итого к оплате)\n` : ''}
${data.painting ? `• Услуга покраски: ${data.paintingCost} руб. (прямые расходы) + 20% агентское вознаграждение (${Math.round(data.paintingCost * 0.2)} руб.) = ${Math.round(data.paintingCost * 1.2)} руб. (итого к оплате)\n` : ''}
` : ''}

РАЗБИВКА СТОИМОСТИ МОДЕЛИРОВАНИЯ:
• Этап 1 (20%): ${data.stage1Cost} руб.
• Этап 2 (30%): ${data.stage2Cost} руб.
• Этап 3 (50%): ${data.stage3Cost} руб.
• ИТОГО: ${data.price} руб.

ДЕТАЛИ ЗАКАЗА:
• Тип модели: ${data.projectType === 'individual' ? 'Индивидуальная модель по фото (стандартная цена)' : 
  data.category?.noDiscount ? 'Бюджетная модель без скидки' : 'Готовая модель с лицом по фото (скидка 50%)'}
• Категория: ${data.category?.name}
• Модель: ${data.modelName}
• Пол: ${data.category?.gender === 'male' ? 'Мужской' : 'Женский'}
• Высота: ${data.height} см
• Срок изготовления: ${data.finalDays} дней
• Эксклюзивные права: ${data.exclusive ? 'ДА' : 'НЕТ'}
• Печать модели: ${data.printing ? 'ДА' : 'НЕТ'}
• Покраска модели: ${data.painting ? 'ДА' : 'НЕТ'}
• Фото загружено: ${data.uploadedPhoto ? 'ДА' : 'НЕТ'}
• Комментарий: ${data.comment || 'Нет комментария'}

Дата формирования: ${data.date.day}.${new Date().getMonth() + 1}.${data.date.year} ${new Date().getHours()}:${new Date().getMinutes()}
`;

        return contractText;
    }
};