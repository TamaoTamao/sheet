// Character Sheet Engine - Original Implementation
class HeroSheetManager {
    constructor() {
        this.storageKey = 'rpg_hero_data_v1';
        this.heroData = this.initializeBlankHero();
        this.attributeList = [
            { key: 'might', label: 'Мощь' },
            { key: 'agility', label: 'Ловкость' },
            { key: 'endurance', label: 'Выносливость' },
            { key: 'intellect', label: 'Разум' },
            { key: 'perception', label: 'Восприятие' },
            { key: 'presence', label: 'Обаяние' }
        ];
        
        this.expertiseList = [
            { name: 'Атлетика', linkedAttr: 'might' },
            { name: 'Акробатика', linkedAttr: 'agility' },
            { name: 'Ловкость рук', linkedAttr: 'agility' },
            { name: 'Скрытность', linkedAttr: 'agility' },
            { name: 'Магические знания', linkedAttr: 'intellect' },
            { name: 'История', linkedAttr: 'intellect' },
            { name: 'Расследование', linkedAttr: 'intellect' },
            { name: 'Природоведение', linkedAttr: 'intellect' },
            { name: 'Религия', linkedAttr: 'intellect' },
            { name: 'Работа с животными', linkedAttr: 'perception' },
            { name: 'Проницательность', linkedAttr: 'perception' },
            { name: 'Врачевание', linkedAttr: 'perception' },
            { name: 'Бдительность', linkedAttr: 'perception' },
            { name: 'Выживание', linkedAttr: 'perception' },
            { name: 'Обман', linkedAttr: 'presence' },
            { name: 'Устрашение', linkedAttr: 'presence' },
            { name: 'Выступление', linkedAttr: 'presence' },
            { name: 'Дипломатия', linkedAttr: 'presence' }
        ];
        
        this.initialize();
    }
    
    initializeBlankHero() {
        return {
            heroName: '',
            profession: '',
            tier: 1,
            ancestry: '',
            attributes: {
                might: 10,
                agility: 10,
                endurance: 10,
                intellect: 10,
                perception: 10,
                presence: 10
            },
            currentLife: 0,
            maxLife: 0,
            defenseRating: 10,
            movementRate: 30,
            expertiseProficiencies: [],
            possessions: [],
            specialAbilities: '',
            adventureLog: ''
        };
    }
    
    initialize() {
        this.buildAttributeSection();
        this.buildExpertiseSection();
        this.attachEventHandlers();
        this.loadFromStorage();
        this.updateAllCalculations();
    }
    
    buildAttributeSection() {
        const container = document.querySelector('.attribute-matrix');
        container.innerHTML = '';
        
        this.attributeList.forEach(attr => {
            const capsule = document.createElement('div');
            capsule.className = 'attribute-capsule';
            capsule.innerHTML = `
                <div class="attribute-title">${attr.label}</div>
                <input type="number" 
                       class="attribute-value-input" 
                       data-attribute="${attr.key}" 
                       value="10" 
                       min="1" 
                       max="30">
                <div class="attribute-modifier-display" data-modifier="${attr.key}">+0</div>
            `;
            container.appendChild(capsule);
        });
    }
    
    buildExpertiseSection() {
        const container = document.querySelector('.expertise-grid');
        container.innerHTML = '';
        
        this.expertiseList.forEach((expertise, index) => {
            const row = document.createElement('div');
            row.className = 'expertise-row';
            row.innerHTML = `
                <input type="checkbox" 
                       class="expertise-toggle" 
                       data-expertise-index="${index}">
                <label class="expertise-name">${expertise.name} (${this.getAttributeShortName(expertise.linkedAttr)})</label>
                <span class="expertise-value" data-expertise-bonus="${index}">+0</span>
            `;
            container.appendChild(row);
        });
    }
    
    getAttributeShortName(attrKey) {
        const shortNames = {
            might: 'Мощ',
            agility: 'Лов',
            endurance: 'Вын',
            intellect: 'Раз',
            perception: 'Вос',
            presence: 'Обн'
        };
        return shortNames[attrKey] || attrKey;
    }
    
    attachEventHandlers() {
        // Attribute inputs
        document.querySelectorAll('.attribute-value-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const attrKey = e.target.dataset.attribute;
                this.heroData.attributes[attrKey] = parseInt(e.target.value) || 10;
                this.updateAllCalculations();
                this.autoSave();
            });
        });
        
        // Expertise checkboxes
        document.querySelectorAll('.expertise-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const expertiseIndex = parseInt(e.target.dataset.expertiseIndex);
                if (e.target.checked) {
                    if (!this.heroData.expertiseProficiencies.includes(expertiseIndex)) {
                        this.heroData.expertiseProficiencies.push(expertiseIndex);
                    }
                } else {
                    this.heroData.expertiseProficiencies = 
                        this.heroData.expertiseProficiencies.filter(i => i !== expertiseIndex);
                }
                this.updateExpertiseCalculations();
                this.autoSave();
            });
        });
        
        // Text and number fields
        document.querySelectorAll('[data-field]').forEach(field => {
            field.addEventListener('input', (e) => {
                const fieldName = e.target.dataset.field;
                if (fieldName === 'newPossession') return; // Skip possession input
                
                if (e.target.type === 'number') {
                    this.heroData[fieldName] = parseInt(e.target.value) || 0;
                } else {
                    this.heroData[fieldName] = e.target.value;
                }
                
                this.autoSave();
            });
        });
        
        // Action buttons
        document.querySelectorAll('.action-control').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Possession management
        const addPossessionBtn = document.querySelector('.add-possession-btn');
        const possessionInput = document.querySelector('[data-field="newPossession"]');
        
        addPossessionBtn.addEventListener('click', () => {
            const itemName = possessionInput.value.trim();
            if (itemName) {
                this.addPossession(itemName);
                possessionInput.value = '';
            }
        });
        
        possessionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const itemName = possessionInput.value.trim();
                if (itemName) {
                    this.addPossession(itemName);
                    possessionInput.value = '';
                }
            }
        });
        
        // Dice modal
        const diceModal = document.getElementById('diceModal');
        document.querySelectorAll('.dice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sides = parseInt(e.target.dataset.sides);
                this.rollDice(sides);
            });
        });
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            diceModal.classList.remove('active');
        });
        
        diceModal.addEventListener('click', (e) => {
            if (e.target === diceModal) {
                diceModal.classList.remove('active');
            }
        });
    }
    
    calculateModifier(attributeValue) {
        return Math.floor((attributeValue - 10) / 2);
    }
    
    getProficiencyBonus() {
        const tier = this.heroData.tier || 1;
        return Math.ceil(tier / 4) + 1;
    }
    
    updateAllCalculations() {
        // Update attribute modifiers
        this.attributeList.forEach(attr => {
            const value = this.heroData.attributes[attr.key];
            const modifier = this.calculateModifier(value);
            const modDisplay = document.querySelector(`[data-modifier="${attr.key}"]`);
            if (modDisplay) {
                modDisplay.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
            }
        });
        
        // Update quickness (initiative) based on agility
        const quicknessInput = document.querySelector('[data-field="quicknessBonus"]');
        if (quicknessInput) {
            const agilityMod = this.calculateModifier(this.heroData.attributes.agility);
            quicknessInput.value = agilityMod >= 0 ? `+${agilityMod}` : `${agilityMod}`;
        }
        
        this.updateExpertiseCalculations();
    }
    
    updateExpertiseCalculations() {
        const profBonus = this.getProficiencyBonus();
        
        this.expertiseList.forEach((expertise, index) => {
            const attrValue = this.heroData.attributes[expertise.linkedAttr];
            const baseMod = this.calculateModifier(attrValue);
            const isProficient = this.heroData.expertiseProficiencies.includes(index);
            const totalBonus = baseMod + (isProficient ? profBonus : 0);
            
            const bonusDisplay = document.querySelector(`[data-expertise-bonus="${index}"]`);
            if (bonusDisplay) {
                bonusDisplay.textContent = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;
            }
        });
    }
    
    addPossession(itemName) {
        this.heroData.possessions.push(itemName);
        this.renderPossessions();
        this.autoSave();
        this.showToast('Предмет добавлен!');
    }
    
    removePossession(index) {
        this.heroData.possessions.splice(index, 1);
        this.renderPossessions();
        this.autoSave();
        this.showToast('Предмет удалён');
    }
    
    renderPossessions() {
        const registry = document.querySelector('.possession-registry');
        registry.innerHTML = '';
        
        this.heroData.possessions.forEach((item, index) => {
            const entry = document.createElement('li');
            entry.className = 'possession-entry';
            entry.innerHTML = `
                <span class="possession-name">${item}</span>
                <button class="remove-possession" data-remove-index="${index}">Удалить</button>
            `;
            registry.appendChild(entry);
        });
        
        // Attach remove handlers
        document.querySelectorAll('.remove-possession').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.removeIndex);
                this.removePossession(index);
            });
        });
    }
    
    handleAction(action) {
        switch(action) {
            case 'persist':
                this.saveToStorage();
                this.showToast('Данные сохранены!');
                break;
            case 'restore':
                this.loadFromStorage();
                this.showToast('Данные загружены!');
                break;
            case 'reset':
                if (confirm('Вы уверены? Все данные будут удалены.')) {
                    this.resetSheet();
                    this.showToast('Лист очищен', true);
                }
                break;
            case 'roll':
                document.getElementById('diceModal').classList.add('active');
                break;
        }
    }
    
    saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.heroData));
    }
    
    loadFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.heroData = JSON.parse(stored);
            this.populateFormFields();
            this.updateAllCalculations();
            this.renderPossessions();
        }
    }
    
    autoSave() {
        this.saveToStorage();
    }
    
    resetSheet() {
        this.heroData = this.initializeBlankHero();
        localStorage.removeItem(this.storageKey);
        this.populateFormFields();
        this.updateAllCalculations();
        this.renderPossessions();
        
        // Reset checkboxes
        document.querySelectorAll('.expertise-toggle').forEach(cb => cb.checked = false);
    }
    
    populateFormFields() {
        // Text and number fields
        Object.keys(this.heroData).forEach(key => {
            const field = document.querySelector(`[data-field="${key}"]`);
            if (field) {
                field.value = this.heroData[key];
            }
        });
        
        // Attributes
        Object.keys(this.heroData.attributes).forEach(attrKey => {
            const input = document.querySelector(`[data-attribute="${attrKey}"]`);
            if (input) {
                input.value = this.heroData.attributes[attrKey];
            }
        });
        
        // Expertise checkboxes
        document.querySelectorAll('.expertise-toggle').forEach(cb => cb.checked = false);
        this.heroData.expertiseProficiencies.forEach(index => {
            const checkbox = document.querySelector(`[data-expertise-index="${index}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    rollDice(sides) {
        const result = Math.floor(Math.random() * sides) + 1;
        const resultDisplay = document.getElementById('diceResult');
        resultDisplay.textContent = `🎲 Результат: ${result}`;
        
        // Animate
        resultDisplay.style.transform = 'scale(1.2)';
        setTimeout(() => {
            resultDisplay.style.transform = 'scale(1)';
        }, 200);
    }
    
    showToast(message, isError = false) {
        const toast = document.getElementById('toastMessage');
        toast.textContent = message;
        toast.className = 'toast-notification visible';
        if (isError) {
            toast.classList.add('error-toast');
        }
        
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                toast.classList.remove('error-toast');
            }, 400);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const manager = new HeroSheetManager();
});
