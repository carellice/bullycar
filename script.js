// BullyCar - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Inizializzazione dell'app
    const app = {
        // Dati dell'app
        data: {
            cars: [],
            currentCarId: null,
            nextId: 1
        },
        
        // Elementi DOM
        elements: {
            // Viste
            garageView: document.getElementById('garage-view'),
            carFormView: document.getElementById('car-form-view'),
            carDetailView: document.getElementById('car-detail-view'),
            maintenanceFormView: document.getElementById('maintenance-form-view'),
            
            // Contenitori
            carsContainer: document.getElementById('cars-container'),
            carInfoContainer: document.getElementById('car-info-container'),
            maintenanceList: document.getElementById('maintenance-list'),
            documentsList: document.getElementById('car-documents'),
            remindersList: document.getElementById('reminders-list'),
            
            // Form
            carForm: document.getElementById('car-form'),
            maintenanceForm: document.getElementById('maintenance-form'),
            
            // Bottoni
            addCarButton: document.getElementById('add-car-button'),
            backButtons: document.querySelectorAll('.back-button'),
            editCarButton: document.getElementById('edit-car-button'),
            themeToggle: document.getElementById('theme-toggle'),
            exportButton: document.getElementById('export-button'),
            importButton: document.getElementById('import-button'),
            addMaintenanceButton: document.getElementById('add-maintenance-button'),
            
            // Tabs
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Modal
            modalContainer: document.getElementById('modal-container'),
            modalTitle: document.getElementById('modal-title'),
            modalContent: document.getElementById('modal-content'),
            modalConfirm: document.getElementById('modal-confirm'),
            modalCancel: document.getElementById('modal-cancel'),
            closeModal: document.getElementById('close-modal'),
            
            // Form elementi
            carImagePreview: document.getElementById('car-image-preview'),
            maintenanceType: document.getElementById('maintenance-type'),
            customTypeContainer: document.getElementById('custom-type-container'),
            maintenanceReminder: document.getElementById('maintenance-reminder'),
            reminderSettings: document.getElementById('reminder-settings'),
            reminderType: document.getElementById('reminder-type'),
            dateReminder: document.querySelector('.date-reminder'),
            intervalReminder: document.querySelector('.interval-reminder'),
            mileageReminder: document.querySelector('.mileage-reminder'),
            
            // Notifiche
            notificationsContainer: document.getElementById('notifications-container'),

            settingsButton: document.getElementById('settings-button'),
        },
        
        // Inizializzazione
        init: function() {
            this.loadData();
            this.bindEvents();
            this.renderCars();
            this.checkReminders();
            this.loadTheme();
            this.updateRemindersBadge();

            // Registra il service worker
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./service-worker.js')
                        .then((registration) => {
                            console.log('ServiceWorker registrato con successo:', registration.scope);
                        })
                        .catch((error) => {
                            console.log('Registrazione ServiceWorker fallita:', error);
                        });
                });
            }

            // Controlla se l'app è stata avviata da una scorciatoia
            const urlParams = new URLSearchParams(window.location.search);
            const action = urlParams.get('action');

            if (action === 'add-car') {
                // Mostra direttamente il form per aggiungere una nuova auto
                this.showCarForm();
            }

            this.currentMaintenanceFilter = 'all';
        },
        
        // Binding degli eventi
        bindEvents: function() {
            // Eventi navigazione
            this.elements.addCarButton.addEventListener('click', () => this.showCarForm());
            
            this.elements.backButtons.forEach(button => {
                button.addEventListener('click', () => this.showGarage());
            });
            
            this.elements.editCarButton.addEventListener('click', () => {
                const car = this.getCarById(this.data.currentCarId);
                if (car) {
                    this.showCarForm(car);
                }
            });
            
            // Eventi form auto
            this.elements.carForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCarForm();
            });
            
            document.querySelectorAll('.cancel-form').forEach(button => {
                button.addEventListener('click', () => this.showGarage());
            });
            
            // Eventi immagine
            document.getElementById('car-image').addEventListener('change', (e) => {
                this.handleImageUpload(e.target.files[0], this.elements.carImagePreview);
            });
            
            // Eventi manutenzione
            this.elements.addMaintenanceButton.addEventListener('click', () => {
                this.showMaintenanceForm();
            });
            
            this.elements.maintenanceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMaintenanceForm();
            });
            
            // Eventi tipo manutenzione
            this.elements.maintenanceType.addEventListener('change', () => {
                const value = this.elements.maintenanceType.value;
                if (value === 'custom') {
                    this.elements.customTypeContainer.classList.remove('hidden');
                } else {
                    this.elements.customTypeContainer.classList.add('hidden');
                }
            });
            
            // Eventi promemoria
            this.elements.maintenanceReminder.addEventListener('change', () => {
                if (this.elements.maintenanceReminder.checked) {
                    this.elements.reminderSettings.classList.remove('hidden');
                } else {
                    this.elements.reminderSettings.classList.add('hidden');
                }
            });
            
            this.elements.reminderType.addEventListener('change', () => {
                const value = this.elements.reminderType.value;
                this.elements.dateReminder.classList.add('hidden');
                this.elements.intervalReminder.classList.add('hidden');
                this.elements.mileageReminder.classList.add('hidden');
                
                if (value === 'date' || value === 'both') {
                    this.elements.dateReminder.classList.remove('hidden');
                }
                
                if (value === 'interval') {
                    this.elements.intervalReminder.classList.remove('hidden');
                }
                
                if (value === 'mileage' || value === 'both') {
                    this.elements.mileageReminder.classList.remove('hidden');
                }
            });
            
            // Eventi tab
            this.elements.tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tab = button.dataset.tab;
                    this.switchTab(tab);
                });
            });
            
            // Eventi tema
            this.elements.themeToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleThemeMenu();
            });
            
            // Eventi modal
            this.elements.closeModal.addEventListener('click', () => this.hideModal());
            this.elements.modalCancel.addEventListener('click', () => this.hideModal());
            
            // Eventi import/export
            this.elements.exportButton.addEventListener('click', () => this.exportData());
            this.elements.importButton.addEventListener('click', () => this.showImportDialog());

            // Eventi impostazioni
            this.elements.settingsButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSettingsMenu();
            });

            // Chiudi i menu quando si clicca altrove
            document.addEventListener('click', () => {
                document.querySelector('.theme-menu')?.classList.add('hidden');
                document.querySelector('.settings-menu')?.classList.add('hidden');
            });

            // Gestione del filtro manutenzione
            document.addEventListener('click', (e) => {
                const filterButton = e.target.closest('.filter-button');
                if (filterButton) {
                    e.stopPropagation();
                    const filterOptions = filterButton.nextElementSibling;
                    filterOptions.classList.toggle('hidden');
                } else {
                    // Chiudi dropdown se si clicca altrove
                    document.querySelectorAll('.filter-options').forEach(el => {
                        el.classList.add('hidden');
                    });
                }

                const filterOption = e.target.closest('.filter-option');
                if (filterOption) {
                    const filterType = filterOption.dataset.type;
                    this.filterMaintenance(filterType);

                    // Aggiorna UI
                    document.querySelectorAll('.filter-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    filterOption.classList.add('selected');
                    document.getElementById('current-filter').textContent = filterOption.textContent;
                }
            });
        },

        toggleSettingsMenu: function() {
            // Chiudi il menu del tema se è aperto
            const themeMenu = document.querySelector('.theme-menu');
            if (themeMenu) {
                themeMenu.classList.add('hidden');
            }

            // Ottieni il menu esistente delle impostazioni
            const existingMenu = document.querySelector('.settings-menu');

            // Se esiste già un menu, semplicemente lo rimuovi (toggle)
            if (existingMenu) {
                existingMenu.remove();
                return;
            }

            // Resto del codice per creare il menu...
            const menu = document.createElement('div');
            menu.className = 'settings-menu';

            menu.innerHTML = `
                <button class="settings-option danger" id="reset-data">
                    <i class="fas fa-trash-alt"></i> Cancella tutti i dati
                </button>
            `;

            // Previeni la propagazione del click
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Aggiungi il menu al documento
            this.elements.settingsButton.parentNode.appendChild(menu);

            // Aggiungi event listener per il reset
            document.getElementById('reset-data').addEventListener('click', () => {
                this.showResetConfirmation();
            });
        },

        filterMaintenance: function(filterType) {
            const car = this.getCarById(this.data.currentCarId);
            if (!car) return;

            // Memorizza il filtro corrente
            this.currentMaintenanceFilter = filterType;

            // Renderizza la lista filtrata
            this.renderMaintenanceList(car);
        },

        showResetConfirmation: function() {
            this.showModal('Cancella tutti i dati', `
        <p><strong>Attenzione!</strong> Questa operazione cancellerà definitivamente tutti i dati dell'app.</p>
        <p>Tutte le auto, gli interventi, i promemoria e i documenti verranno eliminati.</p>
        <p>Questa azione non può essere annullata.</p>
        <p>Se vuoi conservare i tuoi dati, esporta un backup prima di procedere.</p>
    `);

            this.elements.modalConfirm.textContent = 'Cancella tutto';
            this.elements.modalConfirm.classList.add('danger-button');

            this.elements.modalConfirm.onclick = () => {
                this.resetAllData();
                this.hideModal();
            };

            this.elements.modalCancel.onclick = () => {
                this.hideModal();
                this.elements.modalConfirm.classList.remove('danger-button');
            };
        },

        resetAllData: function() {
            // Inizializza un nuovo oggetto dati vuoto
            this.data = {
                cars: [],
                currentCarId: null,
                nextId: 1
            };

            // Salva nel localStorage
            localStorage.removeItem('bullyCarData');

            // Aggiorna l'interfaccia
            this.showNotification('Completato', 'Tutti i dati sono stati cancellati', 'info');
            this.renderCars();
            this.updateRemindersBadge();
        },
        
        // Carica dati dal localStorage
        loadData: function() {
            const savedData = localStorage.getItem('bullyCarData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    this.data = parsedData;
                    
                    // Assicurati che ci sia un ID valido
                    if (!this.data.nextId || this.data.nextId <= 1) {
                        this.data.nextId = 1;
                        this.data.cars.forEach(car => {
                            if (car.id >= this.data.nextId) {
                                this.data.nextId = car.id + 1;
                            }
                        });
                    }
                } catch (e) {
                    console.error('Errore durante il caricamento dei dati:', e);
                    this.showNotification('Errore', 'Impossibile caricare i dati salvati.', 'error');
                }
            }
        },
        
        // Salva dati nel localStorage
        saveData: function() {
            try {
                localStorage.setItem('bullyCarData', JSON.stringify(this.data));
            } catch (e) {
                console.error('Errore durante il salvataggio dei dati:', e);
                this.showNotification('Errore', 'Impossibile salvare i dati.', 'error');
            }
        },
        
        // Gestione navigazione
        showView: function(view) {
            // Nascondi tutte le viste
            this.elements.garageView.classList.remove('active');
            this.elements.carFormView.classList.remove('active');
            this.elements.carDetailView.classList.remove('active');
            this.elements.maintenanceFormView.classList.remove('active');
            
            // Mostra la vista specificata
            view.classList.add('active');
        },
        
        showGarage: function() {
            this.renderCars();
            this.showView(this.elements.garageView);
        },
        
        showCarForm: function(car = null) {
            const formTitle = document.getElementById('form-title');
            const form = this.elements.carForm;
            
            // Reset form
            form.reset();
            this.elements.carImagePreview.innerHTML = '<i class="fas fa-car"></i>';
            
            if (car) {
                // Modifica auto esistente
                formTitle.textContent = 'Modifica auto';
                form.dataset.carId = car.id;
                
                // Popola form
                document.getElementById('car-name').value = car.name;
                document.getElementById('car-brand').value = car.brand;
                document.getElementById('car-model').value = car.model;
                document.getElementById('car-year').value = car.year;
                document.getElementById('car-plate').value = car.plate;
                document.getElementById('car-registration-date').value = car.registrationDate;
                document.getElementById('car-mileage').value = car.mileage;
                
                // Immagine
                if (car.image) {
                    this.elements.carImagePreview.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = car.image;
                    this.elements.carImagePreview.appendChild(img);
                }
            } else {
                // Nuova auto
                formTitle.textContent = 'Nuova auto';
                form.dataset.carId = '';
            }
            
            this.showView(this.elements.carFormView);
        },
        
        showCarDetail: function(carId) {
            this.data.currentCarId = carId;
            const car = this.getCarById(carId);
            
            if (!car) {
                this.showNotification('Errore', 'Auto non trovata', 'error');
                return this.showGarage();
            }

            // Resetta il filtro manutenzione
            this.currentMaintenanceFilter = 'all';

            // Seleziona il filtro "Tutti"
            setTimeout(() => {
                document.querySelectorAll('.filter-option').forEach(opt => {
                    opt.classList.remove('selected');
                    if (opt.dataset.type === 'all') {
                        opt.classList.add('selected');
                    }
                });

                const currentFilterEl = document.getElementById('current-filter');
                if (currentFilterEl) {
                    currentFilterEl.textContent = 'Tutti';
                }
            }, 0);
            
            // Aggiorna titolo
            document.getElementById('car-detail-title').textContent = car.name;
            
            // Immagine
            const imageContainer = this.elements.carInfoContainer.querySelector('.car-image-large');
            imageContainer.innerHTML = '';
            
            if (car.image) {
                const img = document.createElement('img');
                img.src = car.image;
                imageContainer.appendChild(img);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-car';
                imageContainer.appendChild(icon);
            }
            
            // Informazioni auto
            const infoContainer = this.elements.carInfoContainer.querySelector('.car-info');
            infoContainer.innerHTML = `
                <div class="car-info-grid">
                    <div class="info-item">
                        <div class="info-label">Marca</div>
                        <div class="info-value">${car.brand}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Modello</div>
                        <div class="info-value">${car.model}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Anno</div>
                        <div class="info-value">${car.year}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Targa</div>
                        <div class="info-value">${car.plate}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Immatricolazione</div>
                        <div class="info-value">${this.formatDate(car.registrationDate)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Chilometraggio</div>
                        <div class="info-value">${car.mileage.toLocaleString()} km</div>
                    </div>
                </div>
            `;
            
            // Resetta tabs
            this.switchTab('maintenance');
            
            // Renderizza manutenzione
            this.renderMaintenanceList(car);
            
            // Renderizza documenti
            this.renderDocumentsList(car);
            
            // Renderizza promemoria
            this.renderRemindersList(car);
            
            this.showView(this.elements.carDetailView);
        },
        
        showMaintenanceForm: function(maintenance = null) {
            const form = this.elements.maintenanceForm;
            
            // Reset form
            form.reset();
            this.elements.customTypeContainer.classList.add('hidden');
            this.elements.reminderSettings.classList.add('hidden');
            this.elements.dateReminder.classList.remove('hidden');
            this.elements.intervalReminder.classList.add('hidden');
            this.elements.mileageReminder.classList.add('hidden');
            
            if (maintenance) {
                // Modifica manutenzione esistente
                form.dataset.maintenanceId = maintenance.id;
                
                // Popola form
                this.elements.maintenanceType.value = maintenance.type;
                if (maintenance.type === 'custom') {
                    document.getElementById('custom-maintenance-type').value = maintenance.customType;
                    this.elements.customTypeContainer.classList.remove('hidden');
                }
                
                document.getElementById('maintenance-date').value = maintenance.date;
                document.getElementById('maintenance-mileage').value = maintenance.mileage;
                document.getElementById('maintenance-cost').value = maintenance.cost;
                document.getElementById('maintenance-notes').value = maintenance.notes;
                
                // Promemoria
                if (maintenance.reminder) {
                    this.elements.maintenanceReminder.checked = true;
                    this.elements.reminderSettings.classList.remove('hidden');
                    
                    this.elements.reminderType.value = maintenance.reminder.type;
                    
                    if (maintenance.reminder.type === 'date' || maintenance.reminder.type === 'both') {
                        document.getElementById('reminder-date').value = maintenance.reminder.date;
                        this.elements.dateReminder.classList.remove('hidden');
                    }
                    
                    if (maintenance.reminder.type === 'interval') {
                        document.getElementById('reminder-interval-value').value = maintenance.reminder.intervalValue;
                        document.getElementById('reminder-interval-unit').value = maintenance.reminder.intervalUnit;
                        this.elements.intervalReminder.classList.remove('hidden');
                    }
                    
                    if (maintenance.reminder.type === 'mileage' || maintenance.reminder.type === 'both') {
                        document.getElementById('reminder-mileage').value = maintenance.reminder.mileage;
                        this.elements.mileageReminder.classList.remove('hidden');
                    }
                }
            } else {
                // Nuova manutenzione
                form.dataset.maintenanceId = '';
                
                // Imposta data odierna
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('maintenance-date').value = today;
                
                // Imposta chilometraggio attuale
                const car = this.getCarById(this.data.currentCarId);
                if (car) {
                    document.getElementById('maintenance-mileage').value = car.mileage;
                }
            }
            
            this.showView(this.elements.maintenanceFormView);
        },
        
        // Gestione form
        saveCarForm: function() {
            const form = this.elements.carForm;
            const carId = form.dataset.carId;
            
            const carData = {
                name: document.getElementById('car-name').value,
                brand: document.getElementById('car-brand').value,
                model: document.getElementById('car-model').value,
                year: parseInt(document.getElementById('car-year').value),
                plate: document.getElementById('car-plate').value,
                registrationDate: document.getElementById('car-registration-date').value,
                mileage: parseInt(document.getElementById('car-mileage').value) || 0,
                maintenance: [],
                documents: []
            };
            
            // Gestione immagine
            const preview = this.elements.carImagePreview;
            if (preview.querySelector('img')) {
                carData.image = preview.querySelector('img').src;
            }
            
            // Gestione documento PDF
            const docInput = document.getElementById('car-doc');
            if (docInput.files.length > 0) {
                const file = docInput.files[0];
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const doc = {
                        id: Date.now(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result,
                        date: new Date().toISOString()
                    };
                    
                    if (carId) {
                        // Aggiorna auto esistente
                        const car = this.getCarById(parseInt(carId));
                        if (car) {
                            car.documents.push(doc);
                            this.saveData();
                        }
                    } else {
                        // Nuova auto
                        carData.documents.push(doc);
                    }
                };
                
                reader.readAsDataURL(file);
            }
            
            if (carId) {
                // Aggiorna auto esistente
                const car = this.getCarById(parseInt(carId));
                if (car) {
                    car.name = carData.name;
                    car.brand = carData.brand;
                    car.model = carData.model;
                    car.year = carData.year;
                    car.plate = carData.plate;
                    car.registrationDate = carData.registrationDate;
                    car.mileage = carData.mileage;
                    
                    if (carData.image) {
                        car.image = carData.image;
                    }
                    
                    this.showNotification('Successo', 'Auto aggiornata con successo', 'success');
                }
            } else {
                // Nuova auto
                carData.id = this.data.nextId++;
                carData.addDate = new Date().toISOString();
                this.data.cars.push(carData);
                this.showNotification('Successo', 'Auto aggiunta con successo', 'success');
            }
            
            this.saveData();
            this.updateRemindersBadge(); 
            this.showGarage();
        },
        
        saveMaintenanceForm: function() {
            const form = this.elements.maintenanceForm;
            const maintenanceId = form.dataset.maintenanceId;
            const car = this.getCarById(this.data.currentCarId);
            
            if (!car) {
                this.showNotification('Errore', 'Auto non trovata', 'error');
                return;
            }
            
            // Tipo intervento
            let type = this.elements.maintenanceType.value;
            let customType = '';
            
            if (type === 'custom') {
                customType = document.getElementById('custom-maintenance-type').value;
                if (!customType) {
                    this.showNotification('Errore', 'Inserisci un nome per l\'intervento personalizzato', 'error');
                    return;
                }
            }
            
            // Dati intervento
            const maintenanceData = {
                type: type,
                customType: customType,
                date: document.getElementById('maintenance-date').value,
                mileage: parseInt(document.getElementById('maintenance-mileage').value) || 0,
                cost: parseFloat(document.getElementById('maintenance-cost').value) || 0,
                notes: document.getElementById('maintenance-notes').value
            };
            
            // Promemoria
            if (this.elements.maintenanceReminder.checked) {
                const reminderType = this.elements.reminderType.value;
                
                maintenanceData.reminder = {
                    type: reminderType,
                    createdAt: new Date().toISOString()
                };
                
                if (reminderType === 'date' || reminderType === 'both') {
                    maintenanceData.reminder.date = document.getElementById('reminder-date').value;
                }
                
                if (reminderType === 'interval') {
                    maintenanceData.reminder.intervalValue = parseInt(document.getElementById('reminder-interval-value').value) || 1;
                    maintenanceData.reminder.intervalUnit = document.getElementById('reminder-interval-unit').value;
                    
                    // Calcola data promemoria basata sull'intervallo
                    const date = new Date(maintenanceData.date);
                    if (maintenanceData.reminder.intervalUnit === 'month') {
                        date.setMonth(date.getMonth() + maintenanceData.reminder.intervalValue);
                    } else {
                        date.setFullYear(date.getFullYear() + maintenanceData.reminder.intervalValue);
                    }
                    
                    maintenanceData.reminder.date = date.toISOString().split('T')[0];
                }
                
                if (reminderType === 'mileage' || reminderType === 'both') {
                    maintenanceData.reminder.mileage = parseInt(document.getElementById('reminder-mileage').value) || 0;
                }
            }
            
            // Aggiorna chilometraggio auto se quello dell'intervento è superiore
            if (maintenanceData.mileage > car.mileage) {
                car.mileage = maintenanceData.mileage;
            }
            
            if (maintenanceId) {
                // Aggiorna intervento esistente
                const index = car.maintenance.findIndex(m => m.id === parseInt(maintenanceId));
                if (index !== -1) {
                    maintenanceData.id = parseInt(maintenanceId);
                    car.maintenance[index] = maintenanceData;
                    this.showNotification('Successo', 'Intervento aggiornato con successo', 'success');
                }
            } else {
                // Nuovo intervento
                maintenanceData.id = Date.now();
                car.maintenance.push(maintenanceData);
                this.showNotification('Successo', 'Intervento aggiunto con successo', 'success');
                
                // Genera scadenze automatiche per revisione/bollo
                if (type === 'revisione') {
                    this.generateNextRevisionReminder(car, maintenanceData);
                } else if (type === 'bollo') {
                    this.generateNextBolloReminder(car, maintenanceData);
                }
            }
            
            this.saveData();
            this.updateRemindersBadge();
            this.showCarDetail(car.id);
        },
        
        // Gestione auto
        getCarById: function(id) {
            return this.data.cars.find(car => car.id === id);
        },
        
        renderCars: function() {
            const container = this.elements.carsContainer;
            container.innerHTML = '';
            
            if (this.data.cars.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-car" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                        <p>Non hai ancora aggiunto auto al tuo garage.</p>
                        <p>Clicca su "Aggiungi auto" per iniziare.</p>
                    </div>
                `;
                return;
            }
            
            // Ordina per nome
            const sortedCars = [...this.data.cars].sort((a, b) => a.name.localeCompare(b.name));
            
            sortedCars.forEach(car => {
                const alerts = this.getCarAlerts(car);
                const imminentReminders = this.getImminentReminders(car);
                
                const card = document.createElement('div');
                card.className = 'car-card';
                
                let reminderHtml = '';
                if (imminentReminders.length > 0) {
                    reminderHtml = `
                        <div class="car-reminders">
                            <h4 class="reminders-title">Promemoria imminenti:</h4>
                            <ul class="reminders-list">
                                ${imminentReminders.map(reminder => `
                                    <li class="reminder-item-small ${reminder.status}">
                                        <i class="fas fa-bell"></i>
                                        <span>${reminder.typeName}: ${reminder.info}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }
                
                card.innerHTML = `
                    <div class="car-image">
                        ${car.image 
                            ? `<img src="${car.image}" alt="${car.name}">` 
                            : '<i class="fas fa-car"></i>'}
                    </div>
                    <div class="car-details">
                        <div class="car-name">${car.name}</div>
                        <div class="car-info-item">
                            <span class="car-info-label">Targa</span>
                            <span>${car.plate}</span>
                        </div>
                        <div class="car-info-item">
                            <span class="car-info-label">Modello</span>
                            <span>${car.brand} ${car.model} (${car.year})</span>
                        </div>
                        <div class="car-info-item">
                            <span class="car-info-label">Km</span>
                            <span>${car.mileage.toLocaleString()}</span>
                        </div>
                        ${alerts.length > 0 ? `
                            <div class="car-alerts">
                                ${alerts.map(alert => `
                                    <div class="alert-badge">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        ${alert}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${reminderHtml}
                    </div>
                `;
                
                card.addEventListener('click', () => {
                    this.showCarDetail(car.id);
                });
                
                container.appendChild(card);
            });
        },

        getImminentReminders: function(car) {
            if (!car.maintenance) return [];
            
            const today = new Date();
            const imminentReminders = [];
            
            car.maintenance.forEach(m => {
                if (!m.reminder) return;
                
                const r = m.reminder;
                let isImminent = false;
                let status = 'normal';
                let info = '';
                
                // Controlla scadenza per data
                if ((r.type === 'date' || r.type === 'both' || r.type === 'interval') && r.date) {
                    const dueDate = new Date(r.date);
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 0) {
                        status = 'urgent';
                        isImminent = true;
                        
                        if (diffDays === 0) {
                            info = 'oggi';
                        } else {
                            info = `scaduto da ${Math.abs(diffDays)} giorni`;
                        }
                    } else if (diffDays <= 30) {
                        status = 'warning';
                        isImminent = true;
                        
                        if (diffDays === 1) {
                            info = 'domani';
                        } else {
                            info = `tra ${diffDays} giorni`;
                        }
                    }
                }
                
                // Controlla scadenza per chilometraggio
                if ((r.type === 'mileage' || r.type === 'both') && r.mileage) {
                    const diffMileage = r.mileage - car.mileage;
                    
                    if (diffMileage <= 0) {
                        status = 'urgent';
                        isImminent = true;
                        
                        if (!info) {
                            info = `da fare (${r.mileage.toLocaleString()} km)`;
                        }
                    } else if (diffMileage <= 1000) {
                        status = 'warning';
                        isImminent = true;
                        
                        if (!info) {
                            info = `tra ${diffMileage.toLocaleString()} km`;
                        }
                    }
                }
                
                if (isImminent) {
                    const typeName = m.type === 'custom' ? m.customType : this.getMaintenanceTypeName(m.type);
                    
                    imminentReminders.push({
                        typeName: typeName,
                        status: status,
                        info: info
                    });
                }
            });
            
            // Ordina per urgenza (urgent prima di warning)
            imminentReminders.sort((a, b) => {
                const statusOrder = { urgent: 0, warning: 1, normal: 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            });
            
            return imminentReminders;
        },
        
        getCarAlerts: function(car) {
            const alerts = [];
            const today = new Date();
            
            // Controlla promemoria
            car.maintenance.forEach(maintenance => {
                if (maintenance.reminder) {
                    const r = maintenance.reminder;
                    
                    if ((r.type === 'date' || r.type === 'both') && r.date) {
                        const dueDate = new Date(r.date);
                        const diffTime = dueDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 0) {
                            // Scaduto
                            const type = maintenance.type === 'custom' ? maintenance.customType : this.getMaintenanceTypeName(maintenance.type);
                            alerts.push(`${type} scaduto`);
                        } else if (diffDays <= 30) {
                            // In scadenza
                            const type = maintenance.type === 'custom' ? maintenance.customType : this.getMaintenanceTypeName(maintenance.type);
                            alerts.push(`${type} in scadenza`);
                        }
                    }
                    
                    if ((r.type === 'mileage' || r.type === 'both') && r.mileage) {
                        const diffMileage = r.mileage - car.mileage;
                        
                        if (diffMileage <= 0) {
                            // Scaduto
                            const type = maintenance.type === 'custom' ? maintenance.customType : this.getMaintenanceTypeName(maintenance.type);
                            alerts.push(`${type} da fare`);
                        } else if (diffMileage <= 1000) {
                            // In scadenza
                            const type = maintenance.type === 'custom' ? maintenance.customType : this.getMaintenanceTypeName(maintenance.type);
                            alerts.push(`${type} prossimamente`);
                        }
                    }
                }
            });
            
            return alerts;
        },
        
        renderMaintenanceList: function(car) {
            const container = this.elements.maintenanceList;
            container.innerHTML = '';

            if (!car.maintenance || car.maintenance.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Nessun intervento registrato.</p>
                    </div>
                `;
                return;
            }

            // Filtra per tipo se necessario
            let maintenanceItems = [...car.maintenance];

            if (this.currentMaintenanceFilter && this.currentMaintenanceFilter !== 'all') {
                if (this.currentMaintenanceFilter === 'custom') {
                    // Filtra per interventi personalizzati
                    maintenanceItems = maintenanceItems.filter(item => item.type === 'custom');
                } else {
                    // Filtra per tipo specifico
                    maintenanceItems = maintenanceItems.filter(item => item.type === this.currentMaintenanceFilter);
                }

                // Mostra un messaggio se non ci sono interventi del tipo selezionato
                if (maintenanceItems.length === 0) {
                    container.innerHTML = `
                <div class="empty-state">
                    <p>Nessun intervento di tipo "${this.getMaintenanceTypeName(this.currentMaintenanceFilter)}" trovato.</p>
                </div>
            `;
                    return;
                }
            }

            // Ordina per data (più recente prima)
            const sortedMaintenance = maintenanceItems.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );
            
            sortedMaintenance.forEach(item => {
                const maintenanceItem = document.createElement('div');
                maintenanceItem.className = 'maintenance-item';
                
                const typeName = item.type === 'custom' ? item.customType : this.getMaintenanceTypeName(item.type);
                
                maintenanceItem.innerHTML = `
                    <div class="maintenance-header">
                        <div>
                            <div class="maintenance-title">${typeName}</div>
                            <div class="maintenance-date">${this.formatDate(item.date)} - ${item.mileage.toLocaleString()} km</div>
                        </div>
                        <div class="maintenance-cost">€ ${item.cost.toFixed(2)}</div>
                    </div>
                    ${item.notes ? `<div class="maintenance-details">${item.notes}</div>` : ''}
                    ${item.reminder ? `
                        <div class="maintenance-details">
                            <strong>Prossimo intervento:</strong> ${this.formatReminderInfo(item.reminder)}
                        </div>
                    ` : ''}
                    <div class="maintenance-controls">
                        <button class="icon-button edit-maintenance" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-button delete-maintenance" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Aggiungi event listener
                maintenanceItem.querySelector('.edit-maintenance').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showMaintenanceForm(item);
                });
                
                maintenanceItem.querySelector('.delete-maintenance').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showDeleteMaintenanceConfirmation(item.id);
                });
                
                container.appendChild(maintenanceItem);
            });
        },
        
        renderDocumentsList: function(car) {
            const container = this.elements.documentsList;
            container.innerHTML = '';
            
            if (!car.documents || car.documents.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Nessun documento caricato.</p>
                    </div>
                `;
                return;
            }
            
            // Ordina per data (più recente prima)
            const sortedDocs = [...car.documents].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            sortedDocs.forEach(doc => {
                const docItem = document.createElement('div');
                docItem.className = 'document-item';
                
                const fileSize = this.formatFileSize(doc.size);
                
                docItem.innerHTML = `
                    <div class="document-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div class="document-info">
                        <div class="document-title">${doc.name}</div>
                        <div class="document-size">${fileSize} - ${this.formatDate(doc.date)}</div>
                    </div>
                    <button class="icon-button delete-document" data-id="${doc.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                docItem.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-document')) {
                        this.openDocument(doc);
                    }
                });
                
                docItem.querySelector('.delete-document').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showDeleteDocumentConfirmation(doc.id);
                });
                
                container.appendChild(docItem);
            });
        },
        
        renderRemindersList: function(car) {
            const container = this.elements.remindersList;
            container.innerHTML = '';
            
            if (!car.maintenance || car.maintenance.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Nessun promemoria impostato.</p>
                    </div>
                `;
                return;
            }
            
            // Filtra solo gli interventi con promemoria
            const reminders = car.maintenance.filter(m => m.reminder);
            
            if (reminders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Nessun promemoria impostato.</p>
                    </div>
                `;
                return;
            }
            
            // Array per ordinare i promemoria per urgenza
            const today = new Date();
            const nextReminders = [];
            
            reminders.forEach(m => {
                const r = m.reminder;
                if (!r) return;
                
                let daysUntil = Infinity;
                let mileageUntil = Infinity;
                let status = 'normal';
                let isImminent = false;
                
                // Calcola giorni rimanenti
                if ((r.type === 'date' || r.type === 'both' || r.type === 'interval') && r.date) {
                    const dueDate = new Date(r.date);
                    const diffTime = dueDate - today;
                    daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (daysUntil <= 0) {
                        status = 'urgent';
                        isImminent = true;
                    } else if (daysUntil <= 30) {
                        status = 'warning';
                        isImminent = true;
                    }
                }
                
                // Calcola chilometri rimanenti
                if ((r.type === 'mileage' || r.type === 'both') && r.mileage) {
                    mileageUntil = r.mileage - car.mileage;
                    
                    if (mileageUntil <= 0) {
                        status = 'urgent';
                        isImminent = true;
                    } else if (mileageUntil <= 1000) {
                        status = 'warning';
                        isImminent = true;
                    }
                }
                
                nextReminders.push({
                    maintenance: m,
                    daysUntil: daysUntil,
                    mileageUntil: mileageUntil,
                    status: status,
                    isImminent: isImminent
                });
            });
            
            // Calcola il numero di promemoria imminenti per il badge
            const imminentCount = nextReminders.filter(item => item.isImminent).length;
            
            // Aggiorna il badge sul tab dei promemoria
            const remindersTabButton = document.querySelector('.tab-button[data-tab="reminders"]');
            if (remindersTabButton) {
                // Rimuovi badge esistente se presente
                const existingBadge = remindersTabButton.querySelector('.tab-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }
                
                // Aggiungi nuovo badge se ci sono promemoria imminenti
                if (imminentCount > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'tab-badge';
                    badge.textContent = imminentCount;
                    remindersTabButton.appendChild(badge);
                }
            }
            
            // Ordina per urgenza e poi per data
            nextReminders.sort((a, b) => {
                // Prima per stato (urgent, warning, normal)
                const statusOrder = { urgent: 0, warning: 1, normal: 2 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                
                if (statusDiff !== 0) return statusDiff;
                
                // Poi per giorni rimanenti
                if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
                
                // Infine per chilometri rimanenti
                return a.mileageUntil - b.mileageUntil;
            });
            
            nextReminders.forEach(item => {
                const m = item.maintenance;
                const r = m.reminder;
                
                const reminderItem = document.createElement('div');
                reminderItem.className = 'reminder-item';
                
                // Aggiungi la classe 'imminent' se il promemoria è imminente
                if (item.isImminent) {
                    reminderItem.classList.add('imminent');
                }
                
                const typeName = m.type === 'custom' ? m.customType : this.getMaintenanceTypeName(m.type);
                
                reminderItem.innerHTML = `
                    <div class="reminder-icon reminder-${item.status}">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="reminder-info">
                        <div class="reminder-title">${typeName}</div>
                        <div class="reminder-date">${this.formatReminderInfo(r)}</div>
                    </div>
                `;
                
                container.appendChild(reminderItem);
            });
        },
        
        // Gestione immagini e documenti
        handleImageUpload: function(file, previewContainer) {
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                previewContainer.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                previewContainer.appendChild(img);
            };
            
            reader.readAsDataURL(file);
        },

        updateRemindersBadge: function() {
            // Conta i promemoria imminenti totali
            let imminentCount = 0;
            const today = new Date();
            
            this.data.cars.forEach(car => {
                if (!car.maintenance) return;
                
                car.maintenance.forEach(m => {
                    if (!m.reminder) return;
                    const r = m.reminder;
                    
                    // Controlla scadenza per data
                    if ((r.type === 'date' || r.type === 'both' || r.type === 'interval') && r.date) {
                        const dueDate = new Date(r.date);
                        const diffTime = dueDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 30) {
                            imminentCount++;
                        }
                    }
                    
                    // Controlla scadenza per chilometraggio
                    if ((r.type === 'mileage' || r.type === 'both') && r.mileage) {
                        const diffMileage = r.mileage - car.mileage;
                        
                        if (diffMileage <= 1000) {
                            imminentCount++;
                        }
                    }
                });
            });
            
            // Aggiorna tutti i badge dei tab dei promemoria
            document.querySelectorAll('.tab-button[data-tab="reminders"]').forEach(button => {
                // Rimuovi badge esistente se presente
                const existingBadge = button.querySelector('.tab-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }
                
                // Aggiungi nuovo badge se ci sono promemoria imminenti
                if (imminentCount > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'tab-badge';
                    badge.textContent = imminentCount;
                    button.appendChild(badge);
                }
            });
        },

        openDocument: function(doc) {
            // Crea un visualizzatore a schermo intero per il documento
            const viewer = document.createElement('div');
            viewer.className = 'fullscreen-viewer';

            // Aggiungi direttamente la classe del tema corrente
            const isDarkMode = document.getElementById('app-container').classList.contains('dark-mode');
            if (isDarkMode) {
                viewer.classList.add('dark-mode');
            } else {
                viewer.classList.add('light-mode');
            }

            viewer.innerHTML = `
                <div class="viewer-header">
                    <div class="viewer-title">${doc.name}</div>
                    <button class="icon-button close-viewer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="pdf-container fullscreen">
                    <iframe src="${doc.data}" frameborder="0"></iframe>
                </div>
            `;

            // Aggiungi al body
            document.body.appendChild(viewer);
            document.body.style.overflow = 'hidden'; // Impedisce lo scroll del body

            // Gestore di chiusura
            viewer.querySelector('.close-viewer').addEventListener('click', () => {
                document.body.removeChild(viewer);
                document.body.style.overflow = ''; // Ripristina lo scroll
            });
        },
        
        // Gestione promemoria
        checkReminders: function() {
            const today = new Date();
            let notifications = 0;
            
            this.data.cars.forEach(car => {
                if (!car.maintenance) return;
                
                car.maintenance.forEach(m => {
                    if (!m.reminder) return;
                    
                    const r = m.reminder;
                    
                    // Controllo scadenza per data
                    if ((r.type === 'date' || r.type === 'both') && r.date) {
                        const dueDate = new Date(r.date);
                        const diffTime = dueDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 7 && diffDays >= 0) {
                            // Mostra notifica se la scadenza è entro 7 giorni
                            const typeName = m.type === 'custom' ? m.customType : this.getMaintenanceTypeName(m.type);
                            
                            let message;
                            if (diffDays === 0) {
                                message = `${car.name}: ${typeName} scade oggi!`;
                            } else if (diffDays === 1) {
                                message = `${car.name}: ${typeName} scade domani!`;
                            } else {
                                message = `${car.name}: ${typeName} scade tra ${diffDays} giorni (${this.formatDate(r.date)})`;
                            }
                            
                            // Limita le notifiche a 3 per non sovraccaricare l'interfaccia
                            if (notifications < 3) {
                                this.showNotification('Promemoria', message, 'warning');
                                notifications++;
                            }
                        }
                    }
                    
                    // Controllo scadenza per chilometraggio
                    if ((r.type === 'mileage' || r.type === 'both') && r.mileage) {
                        const diffMileage = r.mileage - car.mileage;
                        
                        if (diffMileage <= 500 && diffMileage >= 0) {
                            // Mostra notifica se mancano meno di 500 km
                            const typeName = m.type === 'custom' ? m.customType : this.getMaintenanceTypeName(m.type);
                            
                            // Limita le notifiche a 3
                            if (notifications < 3) {
                                this.showNotification(
                                    'Promemoria', 
                                    `${car.name}: ${typeName} da effettuare tra ${diffMileage} km`,
                                    'warning'
                                );
                                notifications++;
                            }
                        }
                    }
                });
            });
        },
        
        generateNextRevisionReminder: function(car, maintenance) {
            // Calcola automaticamente la prossima revisione in base all'anno di immatricolazione
            const registrationDate = new Date(car.registrationDate);
            const maintenanceDate = new Date(maintenance.date);
            
            // In Italia, la prima revisione è dopo 4 anni, poi ogni 2 anni
            let nextRevisionDate;
            const yearsSinceRegistration = maintenanceDate.getFullYear() - registrationDate.getFullYear();
            
            if (yearsSinceRegistration < 4) {
                // Prima revisione dopo 4 anni dalla immatricolazione
                nextRevisionDate = new Date(registrationDate);
                nextRevisionDate.setFullYear(registrationDate.getFullYear() + 4);
            } else {
                // Revisioni successive ogni 2 anni
                nextRevisionDate = new Date(maintenanceDate);
                nextRevisionDate.setFullYear(maintenanceDate.getFullYear() + 2);
            }
            
            // Crea il promemoria
            maintenance.reminder = {
                type: 'date',
                date: nextRevisionDate.toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };
        },
        
        generateNextBolloReminder: function(car, maintenance) {
            // Il bollo si paga ogni anno
            const maintenanceDate = new Date(maintenance.date);
            const nextBolloDate = new Date(maintenanceDate);
            nextBolloDate.setFullYear(maintenanceDate.getFullYear() + 1);
            
            // Crea il promemoria
            maintenance.reminder = {
                type: 'date',
                date: nextBolloDate.toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };
        },
        
        // Gestione tabs
        switchTab: function(tabName) {
            // Deseleziona tutti i tab
            this.elements.tabButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            this.elements.tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Seleziona tab specifico
            const button = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
            const content = document.getElementById(`${tabName}-tab`);
            
            if (button && content) {
                button.classList.add('active');
                content.classList.add('active');
            }
        },
        
        // Gestione cancellazione
        deleteCarById: function(carId) {
            const index = this.data.cars.findIndex(car => car.id === carId);
            if (index !== -1) {
                this.data.cars.splice(index, 1);
                this.saveData();
                this.showNotification('Successo', 'Auto eliminata con successo', 'success');
                this.showGarage();
            }
        },
        
        deleteMaintenanceById: function(maintenanceId) {
            const car = this.getCarById(this.data.currentCarId);
            if (!car) return;
            
            const index = car.maintenance.findIndex(m => m.id === maintenanceId);
            if (index !== -1) {
                car.maintenance.splice(index, 1);
                this.saveData();
                this.showNotification('Successo', 'Intervento eliminato con successo', 'success');
                this.showCarDetail(car.id);
            }
        },
        
        deleteDocumentById: function(documentId) {
            const car = this.getCarById(this.data.currentCarId);
            if (!car) return;
            
            const index = car.documents.findIndex(d => d.id === documentId);
            if (index !== -1) {
                car.documents.splice(index, 1);
                this.saveData();
                this.showNotification('Successo', 'Documento eliminato con successo', 'success');
                this.showCarDetail(car.id);
            }
        },
        
        showDeleteCarConfirmation: function(carId) {
            const car = this.getCarById(carId);
            if (!car) return;
            
            this.showModal('Elimina auto', `
                <p>Sei sicuro di voler eliminare l'auto "${car.name}"?</p>
                <p>Questa operazione non può essere annullata.</p>
            `);
            
            this.elements.modalConfirm.onclick = () => {
                this.deleteCarById(carId);
                this.hideModal();
            };
        },
        
        showDeleteMaintenanceConfirmation: function(maintenanceId) {
            this.showModal('Elimina intervento', `
                <p>Sei sicuro di voler eliminare questo intervento?</p>
                <p>Questa operazione non può essere annullata.</p>
            `);
            
            this.elements.modalConfirm.onclick = () => {
                this.deleteMaintenanceById(maintenanceId);
                this.hideModal();
            };
        },
        
        showDeleteDocumentConfirmation: function(documentId) {
            this.showModal('Elimina documento', `
                <p>Sei sicuro di voler eliminare questo documento?</p>
                <p>Questa operazione non può essere annullata.</p>
            `);
            
            this.elements.modalConfirm.onclick = () => {
                this.deleteDocumentById(documentId);
                this.hideModal();
            };
        },
        
        // Gestione import/export
        exportData: function() {
            try {
                // Crea un file JSON con i dati
                const dataStr = JSON.stringify(this.data);
                
                // Cifra i dati
                const encryptedData = this.encryptData(dataStr);
                
                // Crea un Blob con i dati cifrati
                const blob = new Blob([encryptedData], {type: 'application/octet-stream'});
                
                // Crea un URL per il blob
                const url = URL.createObjectURL(blob);
                
                // Crea un link per scaricare il file
                const a = document.createElement('a');
                a.href = url;
                a.download = `bullycar_backup_${new Date().toISOString().split('T')[0]}.txt`;
                
                // Aggiunge il link al documento e clicca su di esso
                document.body.appendChild(a);
                a.click();
                
                // Rimuove il link dal documento
                document.body.removeChild(a);
                
                // Libera l'URL
                URL.revokeObjectURL(url);
                
                this.showNotification('Successo', 'Dati esportati con successo', 'success');
            } catch (error) {
                console.error('Errore durante l\'esportazione dei dati:', error);
                this.showNotification('Errore', 'Impossibile esportare i dati', 'error');
            }
        },

        showImportDialog: function() {
            this.showModal('Importa dati', `
                <p>Seleziona un file di backup per importare i tuoi dati.</p>
                <p><strong>Attenzione:</strong> Questa operazione sovrascriverà tutti i dati esistenti.</p>
                <input type="file" id="import-file" accept=".txt" class="import-file-input">
            `);

            // Cambia il testo del pulsante di conferma
            this.elements.modalConfirm.textContent = 'Importa';

            this.elements.modalConfirm.onclick = () => {
                const fileInput = document.getElementById('import-file');
                if (fileInput.files.length > 0) {
                    if(fileInput.files[0].name.startsWith("bullycar_backup")){
                        this.importData(fileInput.files[0]);
                    }else{
                        this.showNotification('Errore', 'File errato', 'error');
                        this.hideModal();
                    }
                }
            };
        },

        importData: function(file) {
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // Decifra i dati
                    const decryptedData = this.decryptData(e.target.result);
                    
                    // Parsa i dati
                    const parsedData = JSON.parse(decryptedData);
                    
                    // Controlla se i dati sono validi
                    if (!parsedData.cars || !Array.isArray(parsedData.cars)) {
                        throw new Error('Formato file non valido');
                    }
                    
                    // Importa i dati
                    this.data = parsedData;
                    this.saveData();
                    
                    // Aggiorna l'interfaccia
                    this.showGarage();
                    this.hideModal();
                    
                    this.showNotification('Successo', 'Dati importati con successo', 'success');
                } catch (error) {
                    console.error('Errore durante l\'importazione dei dati:', error);
                    this.showNotification('Errore', 'Impossibile importare i dati. Il file potrebbe essere danneggiato o non valido.', 'error');
                }
            };
            
            reader.readAsText(file);
        },
        
        // Funzioni di cifratura (semplici per utilizzo locale)
        encryptData: function(data) {
            // Implementazione semplificata, utilizza Base64 per esempio
            // In una vera app si dovrebbe utilizzare una cifratura più robusta
            return btoa(data);
        },
        
        decryptData: function(data) {
            // Decifratura semplificata
            return atob(data);
        },
        
        // Gestione tema
        loadTheme: function() {
            const savedTheme = localStorage.getItem('bullyCarTheme') || 'system';
            this.applyTheme(savedTheme);
            
            // Aggiungi l'event listener per il dropdown del tema
            const themeToggle = this.elements.themeToggle;
            const themeMenu = document.querySelector('.theme-menu');

            themeToggle.addEventListener('click', (e) => {
                e.stopPropagation();

                // Chiudi il menu delle impostazioni se è aperto
                const settingsMenu = document.querySelector('.settings-menu');
                if (settingsMenu) {
                    settingsMenu.remove();
                }

                // Toggle del menu del tema
                themeMenu.classList.toggle('hidden');
            });
            
            // Chiudi il menu quando si clicca altrove
            document.addEventListener('click', () => {
                themeMenu.classList.add('hidden');
            });
            
            // Evita che il click sul menu chiuda il menu stesso
            themeMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Gestisci la selezione del tema
            document.querySelectorAll('.theme-option').forEach(option => {
                option.addEventListener('click', () => {
                    const theme = option.dataset.theme;
                    this.applyTheme(theme);
                    localStorage.setItem('bullyCarTheme', theme);
                    themeMenu.classList.add('hidden');
                });
            });
        },
        
        applyTheme: function(theme) {
            const container = document.getElementById('app-container');
            const themeIcon = this.elements.themeToggle.querySelector('i');
            
            // Rimuovi le classi attuali
            container.classList.remove('dark-mode', 'light-mode');
            
            if (theme === 'dark') {
                container.classList.add('dark-mode');
                themeIcon.className = 'fas fa-moon';
            } else if (theme === 'light') {
                container.classList.add('light-mode');
                themeIcon.className = 'fas fa-sun';
            } else if (theme === 'system') {
                themeIcon.className = 'fas fa-laptop';
                
                // Rileva il tema di sistema
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    container.classList.add('dark-mode');
                } else {
                    container.classList.add('light-mode');
                }
                
                // Aggiungi un listener per cambiamenti al tema di sistema
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                    if (localStorage.getItem('bullyCarTheme') === 'system') {
                        container.classList.remove('dark-mode', 'light-mode');
                        container.classList.add(e.matches ? 'dark-mode' : 'light-mode');
                    }
                });
            }
            
            // Aggiorna il documento per mostrare il tema selezionato nell'interfaccia
            document.querySelectorAll('.theme-option').forEach(option => {
                const isSelected = option.dataset.theme === theme;
                option.classList.toggle('selected', isSelected);
            });
        },
        
        // Modale
        showModal: function(title, content) {
            this.elements.modalTitle.textContent = title;
            this.elements.modalContent.innerHTML = content;
            this.elements.modalContainer.classList.remove('hidden');

            // Reset bottoni
            this.elements.modalConfirm.style.display = 'block';
            this.elements.modalConfirm.textContent = 'Conferma'; // Reset al testo predefinito
            this.elements.modalConfirm.classList.remove('danger-button'); // Rimuovi classe danger
            this.elements.modalCancel.textContent = 'Annulla';
        },
        
        hideModal: function() {
            this.elements.modalContainer.classList.add('hidden');
        },
        
        // Notifiche
        showNotification: function(title, message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            notification.innerHTML = `
                <div class="notification-header">
                    <div class="notification-title">${title}</div>
                    <button class="notification-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-body">${message}</div>
            `;
            
            const closeButton = notification.querySelector('.notification-close');
            closeButton.addEventListener('click', () => {
                this.elements.notificationsContainer.removeChild(notification);
            });
            
            this.elements.notificationsContainer.appendChild(notification);
            
            // Rimuovi automaticamente dopo 4 secondi
            setTimeout(() => {
                if (notification.parentNode === this.elements.notificationsContainer) {
                    this.elements.notificationsContainer.removeChild(notification);
                }
            }, 4000);
        },
        
        // Funzioni di utilità
        getMaintenanceTypeName: function(type) {
            const types = {
                'tagliando': 'Tagliando',
                'revisione': 'Revisione',
                'bollo': 'Bollo',
                'assicurazione': 'Assicurazione',
                'gomme': 'Cambio gomme'
            };
            
            return types[type] || type;
        },
        
        formatDate: function(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },
        
        formatFileSize: function(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        },
        
        formatReminderInfo: function(reminder) {
            let info = '';
            const today = new Date();
            
            // Se è un promemoria basato su data
            if ((reminder.type === 'date' || reminder.type === 'both') && reminder.date) {
                const dueDate = new Date(reminder.date);
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                info += `Prossima scadenza: ${this.formatDate(reminder.date)}`;
                
                // Aggiungi quanto tempo manca
                if (diffDays < 0) {
                    info += ` (scaduto da ${Math.abs(diffDays)} giorni)`;
                } else if (diffDays === 0) {
                    info += ` (oggi)`;
                } else if (diffDays === 1) {
                    info += ` (domani)`;
                } else if (diffDays < 30) {
                    info += ` (tra ${diffDays} giorni)`;
                } else if (diffDays < 365) {
                    const months = Math.floor(diffDays / 30);
                    info += ` (tra circa ${months} ${months === 1 ? 'mese' : 'mesi'})`;
                }
            }
            
            // Se è un promemoria basato su intervallo, mostriamo solo la data di scadenza calcolata
            if (reminder.type === 'interval') {
                if (reminder.date) {
                    const dueDate = new Date(reminder.date);
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    info += `Prossima scadenza: ${this.formatDate(reminder.date)}`;
                    
                    // Aggiungi quanto tempo manca
                    if (diffDays < 0) {
                        info += ` (scaduto da ${Math.abs(diffDays)} giorni)`;
                    } else if (diffDays === 0) {
                        info += ` (oggi)`;
                    } else if (diffDays === 1) {
                        info += ` (domani)`;
                    } else if (diffDays < 30) {
                        info += ` (tra ${diffDays} giorni)`;
                    } else if (diffDays < 365) {
                        const months = Math.floor(diffDays / 30);
                        info += ` (tra circa ${months} ${months === 1 ? 'mese' : 'mesi'})`;
                    }
                } else {
                    const unitText = reminder.intervalUnit === 'month' ? 
                        (reminder.intervalValue === 1 ? 'mese' : 'mesi') :
                        (reminder.intervalValue === 1 ? 'anno' : 'anni');
                    
                    info += `Ogni ${reminder.intervalValue} ${unitText}`;
                }
            }
            
            // Se è un promemoria basato su chilometraggio
            if ((reminder.type === 'mileage' || reminder.type === 'both') && reminder.mileage) {
                if (info) info += '<br>';
                
                // Ottieni l'auto corrente per il chilometraggio attuale
                const car = this.getCarById(this.data.currentCarId);
                if (car) {
                    const diffMileage = reminder.mileage - car.mileage;
                    info += `Prossimo intervento a ${reminder.mileage.toLocaleString()} km`;
                    
                    if (diffMileage <= 0) {
                        info += ` (intervento da fare)`;
                    } else {
                        info += ` (mancano ${diffMileage.toLocaleString()} km)`;
                    }
                } else {
                    info += `Prossimo intervento a ${reminder.mileage.toLocaleString()} km`;
                }
            }
            
            return info;
        }
    };

    
    
    // Inizializza l'app
    app.init();
});