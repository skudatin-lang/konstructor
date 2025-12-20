async function sendOrderToTelegram(state, category, modelName, pricing, photos) {
    const { total } = calculatePrice(state, category, pricing);
    const finalDays = calculateFinalDays(state);
    
    const msg = `
🎯 *НОВЫЙ ЗАКАЗ*

👤 ${state.customerName}
📞 ${state.customerContact}

📋 Детали:
• Тип: ${state.projectType === 'individual' ? 'Индивидуальная' : 'Готовая'}
• Категория: ${category.name}
• Модель: ${modelName}
• Пол: ${state.selectedGender === 'male' ? 'Мужской' : 'Женский'}
• Высота: ${state.height} см
• Срок: ${finalDays} дн
• Эксклюзив: ${state.exclusive ? 'ДА' : 'НЕТ'}
• Печать: ${state.printing ? 'ДА' : 'НЕТ'}
• Покраска: ${state.painting ? 'ДА' : 'НЕТ'}
• Фото: ${photos.length} шт

💰 Итого: ${total.toLocaleString()} ₽

💬 Комментарий: ${state.comment || '---'}
`.trim();
    
    await fetch(`https://api.telegram.org/bot${window.APP_CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: window.APP_CONFIG.TELEGRAM_CHANNEL_ID,
            text: msg,
            parse_mode: 'Markdown'
        })
    });
    
    if (photos[0]) {
        const blob = await fetch(photos[0]).then(r => r.blob());
        const fd = new FormData();
        fd.append('chat_id', window.APP_CONFIG.TELEGRAM_CHANNEL_ID);
        fd.append('photo', blob, 'photo.jpg');
        await fetch(`https://api.telegram.org/bot${window.APP_CONFIG.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: fd
        });
    }
}

async function sendContractToTelegram(text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const fd = new FormData();
    fd.append('chat_id', window.APP_CONFIG.TELEGRAM_CHANNEL_ID);
    fd.append('document', blob, `Договор_${new Date().toISOString().slice(0,10)}.txt`);
    
    await fetch(`https://api.telegram.org/bot${window.APP_CONFIG.TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: fd
    });
}