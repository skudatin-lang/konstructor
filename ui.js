function showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function updateProgressBar(step) {
    document.querySelectorAll('.progress-step').forEach((el, i) => {
        el.classList.toggle('active', i < step);
    });
}

function selectProjectType(type) {
    currentState.projectType = type;
    currentState.height = '15';
    currentState.baseDays = '14';
    currentState.exclusive = false;
    currentState.printing = false;
    currentState.painting = false;
    
    document.querySelectorAll('.project-type-card').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    document.getElementById('next1').disabled = false;
}

function getAvailableCategories(gender) {
    if (!currentState.projectType || !cachedData.categories[gender]) return [];
    return cachedData.categories[gender].filter(cat =>
        cat.availableFor.includes(currentState.projectType) || cat.availableFor.length === 0
    );
}

function renderCategories() {
    const maleCats = getAvailableCategories('male');
    const femaleCats = getAvailableCategories('female');
    renderCategoryGrid('maleCategories', maleCats, 'male');
    renderCategoryGrid('femaleCategories', femaleCats, 'female');
}

function renderCategoryGrid(containerId, categories, gender) {
    const container = document.getElementById(containerId);
    if (categories.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#7f8c8d;">Нет доступных категорий</div>';
        return;
    }
    
    container.innerHTML = '';
    categories.forEach(cat => {
        const price = calculatePrice(currentState, cat, cachedData.pricing).total;
        const div = document.createElement('div');
        div.className = `category-card ${cat.noDiscount ? 'budget-category' : ''}`;
        div.dataset.gender = gender;
        div.dataset.category = cat.id;
        div.innerHTML = `
            <div class="category-image ${gender}">
                <img src="${cat.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGRkQiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Категория</dGV4dD48L3N2Zz4='}" alt="${cat.name}">
            </div>
            <div class="category-info">
                <div class="category-name">${cat.name}</div>
                <div class="category-description">${cat.description}</div>
                <div class="category-price">${price.toLocaleString()} ₽</div>
                ${cat.noDiscount ? '<div class="budget-badge">Без скидки</div>' : ''}
            </div>
        `;
        
        div.onclick = () => {
            document.querySelectorAll('.category-card').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            currentState.selectedGender = gender;
            currentState.selectedCategory = cat.id;
            document.getElementById('next2').disabled = false;
        };
        container.appendChild(div);
    });
}

function getAvailableModels() {
    if (!currentState.selectedCategory || !currentState.selectedGender) return [];
    return cachedData.models[currentState.selectedCategory]?.[currentState.selectedGender] || [];
}

function renderModels() {
    const modelsGrid = document.getElementById('modelsGrid');
    const individualContainer = document.getElementById('individualModelContainer');
    const category = cachedData.categories[currentState.selectedGender].find(c => c.id === currentState.selectedCategory);
    
    modelsGrid.style.display = 'none';
    individualContainer.style.display = 'none';
    
    if (currentState.projectType === 'individual') {
        individualContainer.style.display = 'block';
        document.getElementById('individualModelImage').src = category?.imageUrl || '';
        document.getElementById('individualModelName').textContent = 
            `${currentState.selectedGender === 'male' ? 'Мужская' : 'Женская'} индивидуальная модель: ${category?.name || ''}`;
        currentState.selectedModel = `individual_${currentState.selectedGender}_${currentState.selectedCategory}`;
        document.getElementById('next2_1').disabled = false;
        document.getElementById('photoUploadSection').style.display = 'block';
        return;
    }
    
    modelsGrid.style.display = 'grid';
    modelsGrid.innerHTML = '';
    const models = getAvailableModels();
    
    if (!models.length) {
        modelsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#7f8c8d;">Нет моделей</div>';
        return;
    }
    
    models.forEach(model => {
        const div = document.createElement('div');
        div.className = 'model-card';
        div.dataset.modelId = model.id;
        div.innerHTML = `
            <div class="model-image">
                <img src="${model.imageUrl}" alt="${model.name}">
            </div>
            <div class="model-info">
                <div class="model-name">${model.name}</div>
                <div class="model-style">${model.style || 'Стандарт'}</div>
            </div>
        `;
        
        div.onclick = () => {
            document.querySelectorAll('.model-card').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            currentState.selectedModel = model.id;
            document.getElementById('next2_1').disabled = false;
            document.getElementById('photoUploadSection').style.display = 'block';
        };
        modelsGrid.appendChild(div);
    });
}

function handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    if (currentState.uploadedPhotos.length + files.length > 5) {
        alert('Можно загрузить не более 5 фотографий.');
        return;
    }
    
    const promises = files.map(file => {
        if (!file.type.match('image.*') || file.size > 5 * 1024 * 1024) {
            alert('Файл должен быть изображением и не более 5 МБ');
            return null;
        }
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }).filter(p => p);
    
    Promise.all(promises).then(results => {
        currentState.uploadedPhotos = [...currentState.uploadedPhotos, ...results];
        renderPhotoPreview();
    });
}

function removePhoto(index) {
    currentState.uploadedPhotos.splice(index, 1);
    renderPhotoPreview();
}

function renderPhotoPreview() {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = currentState.uploadedPhotos.map((photo, i) => `
        <div class="preview-photo-item">
            <img src="${photo}" alt="Фото ${i + 1}">
            <button class="remove-photo-btn" onclick="removePhoto(${i})">&times;</button>
        </div>
    `).join('');
}

function goToModelsScreen() {
    if (!currentState.selectedGender || !currentState.selectedCategory) return;
    showScreen('step2_1');
    document.getElementById('modelsTitle').textContent = 
        `Выберите модель: ${cachedData.categories[currentState.selectedGender].find(c => c.id === currentState.selectedCategory)?.name || ''}`;
    renderModels();
    updateProgressBar(3);
}

function backToCategories() {
    currentState.selectedModel = null;
    showScreen('step2');
    document.getElementById('next2_1').disabled = true;
    document.getElementById('photoUploadSection').style.display = 'none';
    updateProgressBar(2);
}

function setupConfigOptions() {
    document.querySelectorAll('#heightGroup .option-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#heightGroup .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentState.height = btn.dataset.value;
            updatePrice();
        };
        if (btn.dataset.value === currentState.height) btn.classList.add('active');
    });
    
    document.querySelectorAll('#daysGroup .option-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#daysGroup .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentState.baseDays = btn.dataset.value;
            updatePrice();
        };
        if (btn.dataset.value === currentState.baseDays) btn.classList.add('active');
    });
}

function toggleExclusive(checked) { 
    currentState.exclusive = checked; 
    updatePrice(); 
}

function togglePrinting(checked) {
    currentState.printing = checked;
    const pt = document.getElementById('paintingToggle');
    pt.disabled = !checked;
    if (!checked) {
        pt.checked = false;
        currentState.painting = false;
        document.getElementById('paintingPrice').style.display = 'none';
    }
    document.getElementById('printingPrice').style.display = checked ? 'block' : 'none';
    updatePrice();
}

function togglePainting(checked) { 
    currentState.painting = checked; 
    document.getElementById('paintingPrice').style.display = checked ? 'block' : 'none'; 
    updatePrice(); 
}

function updatePrice() {
    const category = cachedData.categories[currentState.selectedGender]?.find(c => c.id === currentState.selectedCategory);
    if (!category) return;
    
    const p = calculatePrice(currentState, category, cachedData.pricing);
    document.getElementById('totalPrice').textContent = p.total.toLocaleString();
    document.getElementById('finalDays').textContent = calculateFinalDays(currentState);
    
    if (currentState.printing) document.getElementById('printingCost').textContent = p.printing;
    if (currentState.painting) document.getElementById('paintingCost').textContent = p.painting;
}

function updateSummary() {
    const category = cachedData.categories[currentState.selectedGender]?.find(c => c.id === currentState.selectedCategory);
    let modelName = '---';
    
    if (currentState.projectType === 'individual') {
        modelName = 'Индивидуальная модель';
    } else {
        const model = getAvailableModels().find(m => m.id === currentState.selectedModel);
        modelName = model?.name || '---';
    }
    
    document.getElementById('sumType').textContent = 
        currentState.projectType === 'individual' ? 'Индивидуальная модель (стандартная цена)' : 'Готовая модель (скидка 50%)';
    document.getElementById('sumCategory').textContent = category?.name || '---';
    document.getElementById('sumModel').textContent = modelName;
    document.getElementById('sumHeight').textContent = currentState.height;
    document.getElementById('sumFinalDays').textContent = calculateFinalDays(currentState);
    document.getElementById('sumExcl').textContent = currentState.exclusive ? 'ДА' : 'НЕТ';
    document.getElementById('sumPrint').textContent = currentState.printing ? 'ДА' : 'НЕТ';
    document.getElementById('sumPaint').textContent = currentState.painting ? 'ДА' : 'НЕТ';
    document.getElementById('sumPrice').textContent = 
        calculatePrice(currentState, category, cachedData.pricing).total.toLocaleString();
}

function nextStep(step) {
    if (step === 2) { 
        showScreen('step2'); 
        renderCategories(); 
        updateProgressBar(2); 
    } else if (step === 3) { 
        showScreen('step3'); 
        updateProgressBar(4); 
    } else if (step === 4) { 
        updateSummary(); 
        showScreen('step4'); 
        updateProgressBar(5); 
    }
}

function prevStep(step) {
    if (step === 1) { 
        showScreen('step1'); 
        updateProgressBar(1); 
    } else if (step === 2) { 
        showScreen('step2'); 
        renderCategories(); 
        updateProgressBar(2); 
    } else if (step === 3) { 
        showScreen('step3'); 
        updateProgressBar(4); 
    }
}