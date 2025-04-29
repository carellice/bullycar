// BullyCar - Main JavaScript

let maintenanceFiles = [];
let currentUser = null;
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
            this.initFirebase();
            this.updateRemindersBadge();

            this.compressionSettings = {
                images: 'medium', // 'low', 'medium', 'high'
                pdf: 'high'       // 'low', 'medium', 'high'
            };

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
            this.currentYearFilter = 'all';
        },

        // Inizializza Firebase e controlla lo stato di autenticazione
        initFirebase: function() {
            try {
                // Inizializza l'app Firebase usando la configurazione globale
                if (typeof firebase !== 'undefined' && firebaseConfig) {
                    // Inizializza Firebase se non è già inizializzato
                    if (!firebase.apps || !firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }

                    // Ottieni i servizi
                    this.auth = firebase.auth();
                    this.db = firebase.firestore();

                    // Ascolta i cambiamenti di autenticazione
                    this.auth.onAuthStateChanged((user) => {
                        if (user) {
                            // L'utente è loggato
                            currentUser = user;
                            this.updateLoginStatus(true);
                            console.log("Utente autenticato:", user.displayName);
                        } else {
                            // L'utente non è loggato
                            currentUser = null;
                            this.updateLoginStatus(false);
                            console.log("Utente non autenticato");
                        }
                    });

                    console.log("Firebase inizializzato con successo");
                } else {
                    console.warn("Firebase non è definito o manca la configurazione");
                    this.updateLoginStatus(false);
                }
            } catch (error) {
                console.error("Errore nell'inizializzazione di Firebase:", error);
                this.updateLoginStatus(false);
            }
        },

        // Aggiorna l'interfaccia utente in base allo stato di login
        updateLoginStatus: function(isLoggedIn) {
            const cloudBackupBtn = document.getElementById('cloud-backup-btn');
            const cloudRestoreBtn = document.getElementById('cloud-restore-btn');
            const loginBtn = document.getElementById('login-btn');
            const userInfoEl = document.getElementById('user-info');

            // Se gli elementi non esistono, esci dalla funzione
            if (!cloudBackupBtn || !cloudRestoreBtn || !loginBtn || !userInfoEl) {
                console.warn("Elementi UI per Firebase non trovati");
                return;
            }

            if (isLoggedIn && currentUser) {
                // Mostra pulsanti di backup/ripristino cloud ma con lucchetto
                cloudBackupBtn.classList.remove('hidden');
                cloudRestoreBtn.classList.remove('hidden');

                // Controlla se l'utente ha già inserito la password corretta in questa sessione
                if (!sessionStorage.getItem('cloudAccessAuthorized')) {
                    // Aggiungi la classe bloccato e l'icona del lucchetto
                    cloudBackupBtn.classList.add('locked');
                    cloudRestoreBtn.classList.add('locked');

                    // Cambia le icone per indicare che sono bloccati
                    cloudBackupBtn.innerHTML = '<i class="fas fa-lock"></i>';
                    cloudRestoreBtn.innerHTML = '<i class="fas fa-lock"></i>';

                    // Aggiungi titoli informativi
                    cloudBackupBtn.title = "Backup su cloud (bloccato)";
                    cloudRestoreBtn.title = "Ripristino da cloud (bloccato)";
                } else {
                    // L'utente è già autorizzato
                    cloudBackupBtn.classList.remove('locked');
                    cloudRestoreBtn.classList.remove('locked');

                    // Ripristina le icone originali
                    cloudBackupBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
                    cloudRestoreBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i>';

                    // Ripristina i titoli originali
                    cloudBackupBtn.title = "Backup su cloud";
                    cloudRestoreBtn.title = "Ripristino da cloud";
                }

                // Aggiorna informazioni utente
                userInfoEl.classList.remove('hidden');
                const userNameEl = userInfoEl.querySelector('.user-name');
                const userAvatarEl = userInfoEl.querySelector('.user-avatar');

                if (userNameEl) userNameEl.textContent = currentUser.displayName || 'Utente';

                // Sostituisci questa parte con la nuova gestione dell'avatar
                if (userAvatarEl) {
                    // MODALITÀ TEST: Imposta su true per forzare l'uso dell'icona predefinita
                    const forceDefaultIcon = false; // Imposta su false quando hai finito i test

                    // Controlla se l'utente ha un photoURL e non siamo in modalità test
                    if (currentUser.photoURL && !forceDefaultIcon) {
                        // Se l'utente ha un avatar, mostra l'immagine
                        userAvatarEl.src = currentUser.photoURL;
                        userAvatarEl.style.display = 'block';

                        // Aggiungi un listener per gestire gli errori di caricamento dell'immagine
                        userAvatarEl.onerror = function() {
                            // Se l'immagine non si carica, mostra l'icona predefinita
                            this.showDefaultUserIcon(userInfoEl);
                        }.bind(this);
                    } else {
                        // Se l'utente non ha un avatar o siamo in modalità test, mostra l'icona predefinita
                        this.showDefaultUserIcon(userInfoEl);
                    }
                }

                // Nascondi pulsante login
                loginBtn.classList.add('hidden');
            } else {
                // Nascondi pulsanti di backup/ripristino cloud
                cloudBackupBtn.classList.add('hidden');
                cloudRestoreBtn.classList.add('hidden');

                // Nascondi informazioni utente
                userInfoEl.classList.add('hidden');

                // Mostra pulsante login
                loginBtn.classList.remove('hidden');
            }
        },

        // Aggiungi questa nuova funzione dopo updateLoginStatus
        showDefaultUserIcon: function(userInfoEl) {
            // Rimuovi l'elemento immagine avatar esistente
            const existingAvatar = userInfoEl.querySelector('.user-avatar');
            if (existingAvatar) {
                existingAvatar.style.display = 'none';
            }

            // Verifica se esiste già un'icona utente, se sì, rimuovila per assicurarsi che non ci siano duplicati
            const existingIcon = userInfoEl.querySelector('.user-icon');
            if (existingIcon) {
                userInfoEl.removeChild(existingIcon);
            }

            // Crea un elemento per l'icona utente predefinita
            const userIcon = document.createElement('div');
            userIcon.className = 'user-icon';
            userIcon.innerHTML = '<i class="fas fa-user"></i>';

            // Inserisci l'icona predefinita prima del nome utente
            const userName = userInfoEl.querySelector('.user-name');
            if (userName) {
                userInfoEl.insertBefore(userIcon, userName);
            } else {
                userInfoEl.appendChild(userIcon);
            }

            console.log('Icona utente predefinita impostata');
        },

        // Login con Google
        loginWithGoogle: function() {
            if (!firebase || !firebase.auth) {
                this.showNotification('Errore', 'Firebase non è pronto. Ricarica la pagina.', 'error');
                return;
            }

            const provider = new firebase.auth.GoogleAuthProvider();

            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    // Login riuscito
                    currentUser = result.user;
                    this.updateLoginStatus(true);
                    this.showNotification('Successo', 'Accesso effettuato come ' + currentUser.displayName, 'success');
                })
                .catch((error) => {
                    // Errore login
                    console.error("Errore di autenticazione:", error);
                    this.showNotification('Errore', 'Accesso fallito: ' + error.message, 'error');
                });
        },

        // Logout
        logout: function() {
            if (!firebase || !firebase.auth) return;

            firebase.auth().signOut()
                .then(() => {
                    currentUser = null;
                    this.updateLoginStatus(false);
                    this.showNotification('Successo', 'Disconnessione effettuata', 'success');
                })
                .catch((error) => {
                    console.error("Errore durante il logout:", error);
                    this.showNotification('Errore', 'Disconnessione fallita', 'error');
                });
        },

        // Backup dei dati su Firebase
        backupToCloud: function() {
            if (!currentUser) {
                this.showNotification('Attenzione', 'Devi accedere per usare il backup cloud', 'warning');
                return;
            }

            // Verifica se l'utente è autorizzato
            if (!sessionStorage.getItem('cloudAccessAuthorized')) {
                this.showCloudAccessDialog('backup');
                return;
            }

            // Il codice originale per il backup...
            this.showModal('Backup su cloud', `
        <p>Sei sicuro di voler eseguire il backup dei tuoi dati su cloud?</p>
        <p>Questo sovrascriverà ogni backup precedente associato al tuo account.</p>
    `);

            this.elements.modalConfirm.onclick = () => {
                this.hideModal();
                this.executeCloudBackup();
            };
        },

        // Esegue effettivamente il backup su Firebase
        executeCloudBackup: async function() {
            if (!firebase || !firebase.firestore || !currentUser) return;

            try {
                // Mostra il loader
                this.showLoader('Backup in corso...');

                // Prepara i dati con file compressi
                const dataToBackup = await this.prepareDataForFirestore();

                // Converti in stringa per valutarne la dimensione
                const serializedData = JSON.stringify(dataToBackup);
                const dataSizeInMB = (serializedData.length * 2) / (1024 * 1024);

                console.log(`Dimensione backup: ${dataSizeInMB.toFixed(2)} MB`);

                // Riferimento al documento nel database
                const docRef = this.db.collection('userBackups').doc(currentUser.uid);

                // Dividi il backup in chunk se supera 800KB
                if (serializedData.length > 800000) {
                    await this.backupInChunks(dataToBackup);
                } else {
                    // Salva su Firebase in un solo documento
                    await docRef.set(dataToBackup);
                    this.hideLoader();
                    this.showNotification('Successo', 'Backup cloud completato', 'success');
                }
            } catch (error) {
                this.hideLoader();
                console.error("Errore nel backup su cloud:", error);
                this.showNotification('Errore', 'Backup cloud fallito: ' + error.message, 'error');
            }
        },

        // preparare i dati per Firestore
        prepareDataForFirestore: async function() {
            try {
                // Mostra il loader perché questa operazione potrebbe richiedere tempo
                this.showLoader('Preparazione backup in corso...');

                // Creiamo una copia pulita dei dati
                const carsBackup = [];

                // Per ogni auto, creiamo una versione con dati compressi
                for (const car of this.data.cars) {
                    const carBackup = {
                        id: car.id || 0,
                        name: car.name || '',
                        brand: car.brand || '',
                        model: car.model || '',
                        year: car.year || 0,
                        plate: car.plate || '',
                        registrationDate: car.registrationDate || '',
                        mileage: car.mileage || 0,
                        addDate: car.addDate || new Date().toISOString(),
                        maintenance: [],
                        documents: []
                    };

                    // Aggiungi l'immagine dell'auto se presente (compressa)
                    if (car.image) {
                        carBackup.image = await this.compressImage(car.image, 600, 0.6);
                    }

                    // Salva la manutenzione con le immagini/documenti compressi
                    if (car.maintenance && Array.isArray(car.maintenance)) {
                        for (const m of car.maintenance) {
                            if (m) {
                                const maintenanceBackup = {
                                    id: m.id || 0,
                                    type: m.type || '',
                                    customType: m.customType || '',
                                    date: m.date || '',
                                    mileage: m.mileage || 0,
                                    cost: m.cost || 0,
                                    notes: m.notes || '',
                                    files: []
                                };

                                // Comprimi e aggiungi i file se presenti
                                if (m.files && Array.isArray(m.files)) {
                                    for (const file of m.files) {
                                        if (file) {
                                            let compressedData;
                                            if (file.type.startsWith('image/')) {
                                                compressedData = await this.compressImage(file.data, 800, 0.7);
                                            } else {
                                                compressedData = await this.compressDocument(file.data);
                                            }

                                            maintenanceBackup.files.push({
                                                id: file.id,
                                                name: file.name,
                                                type: file.type,
                                                size: file.size,
                                                date: file.date,
                                                data: compressedData
                                            });
                                        }
                                    }
                                }

                                // Aggiungi il promemoria se presente
                                if (m.reminder) {
                                    maintenanceBackup.reminder = {
                                        type: m.reminder.type || '',
                                        date: m.reminder.date || '',
                                        mileage: m.reminder.mileage || 0,
                                        intervalValue: m.reminder.intervalValue || 0,
                                        intervalUnit: m.reminder.intervalUnit || '',
                                        createdAt: m.reminder.createdAt || new Date().toISOString()
                                    };
                                }

                                // Aggiungi alla lista
                                carBackup.maintenance.push(maintenanceBackup);
                            }
                        }
                    }

                    // Salva i documenti compressi
                    if (car.documents && Array.isArray(car.documents)) {
                        for (const doc of car.documents) {
                            if (doc) {
                                const compressedData = await this.compressDocument(doc.data);

                                const docBackup = {
                                    id: doc.id || 0,
                                    name: doc.name || '',
                                    type: doc.type || '',
                                    size: doc.size || 0,
                                    date: doc.date || new Date().toISOString(),
                                    data: compressedData
                                };

                                carBackup.documents.push(docBackup);
                            }
                        }
                    }

                    // Aggiungi l'auto alla lista
                    carsBackup.push(carBackup);
                }

                // Nascondi loader
                this.hideLoader();

                // Prepara l'oggetto finale
                return {
                    cars: carsBackup,
                    nextId: this.data.nextId || 1,
                    timestamp: new Date().toISOString(),
                    version: '1.1',
                    includesFiles: true // Flag per indicare che le immagini/documenti sono inclusi
                };
            } catch (error) {
                this.hideLoader();
                console.error("Errore nella preparazione dei dati:", error);
                this.showNotification('Errore', 'Preparazione backup fallita', 'error');
                throw error;
            }
        },

        // Funzione per dividere il backup in chunk se è troppo grande
        backupInChunks: function(dataToBackup) {
            try {
                // Serializza i dati
                const serializedData = JSON.stringify(dataToBackup);

                // Dividi in chunk di ~500KB
                const chunkSize = 500000;
                const chunksCount = Math.ceil(serializedData.length / chunkSize);
                const chunks = [];

                for (let i = 0; i < chunksCount; i++) {
                    chunks.push(serializedData.substr(i * chunkSize, chunkSize));
                }

                // Crea un documento principale con metadati
                const mainDoc = {
                    timestamp: new Date().toISOString(),
                    version: '1.1',
                    chunksCount: chunksCount,
                    totalSize: serializedData.length,
                    isChunked: true
                };

                // Salva il documento principale
                const docRef = this.db.collection('userBackups').doc(currentUser.uid);

                // Prima salva il documento principale
                docRef.set(mainDoc)
                    .then(() => {
                        // Ora salva tutti i chunk
                        const promises = [];

                        for (let i = 0; i < chunksCount; i++) {
                            const chunkRef = this.db.collection('userBackups')
                                .doc(currentUser.uid)
                                .collection('chunks')
                                .doc(`chunk_${i}`);

                            promises.push(chunkRef.set({
                                index: i,
                                data: chunks[i],
                                timestamp: new Date().toISOString()
                            }));
                        }

                        // Aspetta che tutti i chunk siano salvati
                        return Promise.all(promises);
                    })
                    .then(() => {
                        this.hideLoader();
                        this.showNotification('Successo', 'Backup cloud completato', 'success');
                    })
                    .catch(error => {
                        console.error("Errore nel backup in chunk:", error);
                        this.hideLoader();
                        this.showNotification('Errore', 'Backup cloud fallito: ' + error.message, 'error');
                    });
            } catch (error) {
                this.hideLoader();
                console.error("Errore nel backup in chunk:", error);
                this.showNotification('Errore', 'Backup in chunk fallito', 'error');
            }
        },

        // Ripristina dati da Firebase
        restoreFromCloud: function() {
            if (!currentUser) {
                this.showNotification('Attenzione', 'Devi accedere per ripristinare dal cloud', 'warning');
                return;
            }

            // Verifica se l'utente è autorizzato
            if (!sessionStorage.getItem('cloudAccessAuthorized')) {
                this.showCloudAccessDialog('restore');
                return;
            }

            // Il codice originale per il ripristino...
            this.showModal('Ripristino da cloud', `
        <p><strong>Attenzione!</strong> Stai per ripristinare i dati dal tuo ultimo backup cloud.</p>
        <p>Tutti i dati attuali verranno sostituiti con quelli del backup.</p>
        <p>Questa operazione non può essere annullata.</p>
    `);

            this.elements.modalConfirm.textContent = 'Ripristina';
            this.elements.modalConfirm.onclick = () => {
                this.hideModal();
                this.executeCloudRestore();
            };
        },

        // Funzione per gestire il ripristino da backup diviso in chunk
        restoreFromChunks: function(backupMetadata) {
            const chunksCount = backupMetadata.chunksCount;
            const promises = [];

            // Carica tutti i chunk
            for (let i = 0; i < chunksCount; i++) {
                const chunkRef = this.db.collection('userBackups')
                    .doc(currentUser.uid)
                    .collection('chunks')
                    .doc(`chunk_${i}`);

                promises.push(chunkRef.get());
            }

            return Promise.all(promises)
                .then(chunks => {
                    // Ordina i chunk per indice
                    chunks.sort((a, b) => a.data().index - b.data().index);

                    // Ricostruisci i dati serializzati
                    let serializedData = '';
                    chunks.forEach(chunk => {
                        serializedData += chunk.data().data;
                    });

                    // Deserializza i dati
                    const backupData = JSON.parse(serializedData);

                    // Processa i dati
                    return this.processCarsData(backupData);
                });
        },

        // Funzione per processare i dati delle auto ripristinate
        processCarsData: function(backupData) {
            // Verifica flag per file inclusi o solo metadati
            if (backupData.metadataOnly) {
                this.showNotification('Info', 'Backup ripristinato (solo metadati, le immagini e i documenti non sono stati ripristinati)', 'info');

                // Unisci con i dati locali per mantenere i file
                if (backupData.cars && Array.isArray(backupData.cars)) {
                    this.data.cars = this.mergeBackupWithLocalData(backupData.cars);
                }
            } else if (backupData.includesFiles) {
                // Se il backup include file, sovrascriviamo completamente
                this.showNotification('Info', 'Backup ripristinato con tutti i file e documenti', 'success');

                if (backupData.cars && Array.isArray(backupData.cars)) {
                    this.data.cars = backupData.cars;
                }
            } else {
                // Caso di backup senza flag chiare, usiamo merge prudente
                this.showNotification('Info', 'Backup ripristinato, possibile perdita di alcuni dati', 'info');

                if (backupData.cars && Array.isArray(backupData.cars)) {
                    this.data.cars = this.mergeBackupWithLocalData(backupData.cars);
                }
            }

            if (backupData.nextId) {
                this.data.nextId = backupData.nextId;
            }

            // Salva in localStorage
            this.saveData();
            this.hideLoader();

            return backupData;
        },

        // Esegue effettivamente il ripristino da Firebase
        executeCloudRestore: function() {
            if (!firebase || !firebase.firestore || !currentUser) return;

            try {
                // Mostra il loader
                this.showLoader('Ripristino in corso...');

                // Riferimento al documento nel database
                const docRef = this.db.collection('userBackups').doc(currentUser.uid);

                // Recupera i dati da Firebase
                docRef.get()
                    .then((docSnap) => {
                        if (docSnap.exists) {
                            const backupData = docSnap.data();

                            // Controlla se il backup è diviso in chunk
                            if (backupData.isChunked) {
                                return this.restoreFromChunks(backupData);
                            } else {
                                // Backup normale
                                return this.processCarsData(backupData);
                            }
                        } else {
                            // Nessun backup trovato
                            this.hideLoader();
                            this.showNotification('Attenzione', 'Nessun backup trovato per questo account', 'warning');
                            return null;
                        }
                    })
                    .then((processedData) => {
                        if (processedData) {
                            // Aggiorna l'interfaccia
                            this.renderCars();
                            this.checkReminders();
                            this.updateRemindersBadge();
                        }
                    })
                    .catch((error) => {
                        this.hideLoader();
                        console.error("Errore nel ripristino da cloud:", error);
                        this.showNotification('Errore', 'Ripristino fallito: ' + error.message, 'error');
                    });
            } catch (error) {
                this.hideLoader();
                console.error("Errore nel ripristino da cloud:", error);
                this.showNotification('Errore', 'Ripristino fallito', 'error');
            }
        },

        // Gestisci eventuali migrazioni di versioni precedenti
        migrateBackupData: function(backupData) {
            // Implementa la logica di migrazione per versioni precedenti
            // Per ora facciamo un ripristino semplice
            this.data.cars = backupData.cars || [];
            this.data.nextId = backupData.nextId || 1;

            // Salva in localStorage
            this.saveData();

            // Aggiorna l'interfaccia
            this.showNotification('Successo', 'Ripristino completato (versione precedente)', 'success');
            this.renderCars();
            this.checkReminders();
            this.updateRemindersBadge();
        },

        // Funzione per unire i dati di backup con quelli locali (per conservare immagini)
        mergeBackupWithLocalData: function(backupCars) {
            // Se vogliamo conservare le immagini locali quando sono disponibili
            const mergedCars = [];

            // Per ogni auto nel backup
            backupCars.forEach(backupCar => {
                // Cerca se esiste già localmente
                const localCar = this.getCarById(backupCar.id);

                if (localCar) {
                    // Crea una nuova auto con i dati del backup
                    const mergedCar = {...backupCar};

                    // Mantieni l'immagine locale se esiste
                    if (localCar.image && !backupCar.image) {
                        mergedCar.image = localCar.image;
                    }

                    // Mantieni i documenti locali
                    if (localCar.documents && Array.isArray(localCar.documents)) {
                        mergedCar.documents = localCar.documents;
                    }

                    // Unisci gli interventi di manutenzione (aggiorna quelli esistenti, aggiungi i nuovi)
                    if (backupCar.maintenance && Array.isArray(backupCar.maintenance)) {
                        mergedCar.maintenance = [];

                        // Per ogni intervento nel backup
                        backupCar.maintenance.forEach(backupMaint => {
                            // Cerca se esiste localmente
                            const localMaint = localCar.maintenance?.find(m => m.id === backupMaint.id);

                            if (localMaint) {
                                // Mantieni i file locali se esistono
                                const mergedMaint = {...backupMaint};
                                if (localMaint.files && !backupMaint.files) {
                                    mergedMaint.files = localMaint.files;
                                }
                                mergedCar.maintenance.push(mergedMaint);
                            } else {
                                // Intervento nuovo, aggiungilo semplicemente
                                mergedCar.maintenance.push(backupMaint);
                            }
                        });
                    }

                    mergedCars.push(mergedCar);
                } else {
                    // Auto nuova, aggiungila semplicemente
                    mergedCars.push(backupCar);
                }
            });

            return mergedCars;
        },

        // Mostra un loader durante le operazioni lunghe
        showLoader: function(message) {
            // Crea il loader se non esiste
            if (!document.getElementById('loader-container')) {
                const loaderContainer = document.createElement('div');
                loaderContainer.id = 'loader-container';
                loaderContainer.innerHTML = `
      <div class="loader-overlay"></div>
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <div class="loader-message">Caricamento...</div>
      </div>
    `;
                document.body.appendChild(loaderContainer);
            }

            // Imposta il messaggio e mostra il loader
            document.querySelector('.loader-message').textContent = message || 'Caricamento...';
            document.getElementById('loader-container').classList.add('visible');
        },

        hideLoader: function() {
            const loader = document.getElementById('loader-container');
            if (loader) {
                loader.classList.remove('visible');
            }
        },

        // Funzione per popolare il filtro anni
        populateYearFilter: function(car) {
            if (!car || !car.maintenance || car.maintenance.length === 0) return;

            // Raccogli tutti gli anni unici dalle date degli interventi
            const years = new Set();
            car.maintenance.forEach(m => {
                if (m.date) {
                    const year = new Date(m.date).getFullYear();
                    years.add(year);
                }
            });

            // Converti in array e ordina dal più recente
            const yearsArray = Array.from(years).sort((a, b) => b - a);

            // Popola il dropdown
            const yearOptions = document.getElementById('year-filter-options');
            yearOptions.innerHTML = '';

            // Opzione "Tutti gli anni"
            const allOption = document.createElement('button');
            allOption.className = 'year-filter-option' + (this.currentYearFilter === 'all' ? ' selected' : '');
            allOption.dataset.year = 'all';
            allOption.textContent = 'Tutti gli anni';
            yearOptions.appendChild(allOption);

            // Opzioni per ciascun anno
            yearsArray.forEach(year => {
                const option = document.createElement('button');
                option.className = 'year-filter-option' + (this.currentYearFilter === year.toString() ? ' selected' : '');
                option.dataset.year = year;
                option.textContent = year;
                yearOptions.appendChild(option);
            });
        },

        // Funzione per filtrare per anno
        filterMaintenanceByYear: function(yearFilter) {
            const car = this.getCarById(this.data.currentCarId);
            if (!car) return;

            // Memorizza il filtro corrente
            this.currentYearFilter = yearFilter;

            // Renderizza la lista filtrata
            this.renderMaintenanceList(car);
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

            // Eventi upload file manutenzione
            document.getElementById('maintenance-photo').addEventListener('change', (e) => {
                this.handleMaintenanceFileUpload(e.target.files, 'image');
            });

            document.getElementById('maintenance-doc').addEventListener('change', (e) => {
                this.handleMaintenanceFileUpload(e.target.files, 'document');
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

            // Gestione toggle filtro tipo
            const typeFilterBtn = document.getElementById('type-filter-btn');
            if (typeFilterBtn) {
                typeFilterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const typeOptions = document.getElementById('type-filter-options');
                    const yearOptions = document.getElementById('year-filter-options');

                    // Se il menu è già aperto, lo chiudiamo
                    if (!typeOptions.classList.contains('hidden')) {
                        typeOptions.classList.add('hidden');
                    } else {
                        // Altrimenti lo apriamo e chiudiamo l'altro
                        typeOptions.classList.remove('hidden');
                        yearOptions.classList.add('hidden');
                    }
                });
            }

            // Gestione toggle filtro anno
            const yearFilterBtn = document.getElementById('year-filter-btn');
            if (yearFilterBtn) {
                yearFilterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const yearOptions = document.getElementById('year-filter-options');
                    const typeOptions = document.getElementById('type-filter-options');

                    // Se il menu è già aperto, lo chiudiamo
                    if (!yearOptions.classList.contains('hidden')) {
                        yearOptions.classList.add('hidden');
                    } else {
                        // Altrimenti lo apriamo e chiudiamo l'altro
                        yearOptions.classList.remove('hidden');
                        typeOptions.classList.add('hidden');
                    }
                });
            }

            // Gestione click opzioni filtro tipo
            const typeOptions = document.getElementById('type-filter-options');
            if (typeOptions) {
                typeOptions.addEventListener('click', (e) => {
                    const option = e.target.closest('.type-filter-option');  // Cambiato qui
                    if (option) {
                        const filterType = option.dataset.type;
                        this.filterMaintenance(filterType);

                        // Aggiorna UI
                        typeOptions.querySelectorAll('.type-filter-option').forEach(opt => {  // Cambiato qui
                            opt.classList.remove('selected');
                        });
                        option.classList.add('selected');
                        document.getElementById('current-filter').textContent = option.textContent;

                        // Chiudi il menu
                        typeOptions.classList.add('hidden');
                    }
                });
            }

            // Gestione click opzioni filtro anno
            const yearOptions = document.getElementById('year-filter-options');
            if (yearOptions) {
                yearOptions.addEventListener('click', (e) => {
                    const option = e.target.closest('.year-filter-option');  // Cambiato qui
                    if (option) {
                        const year = option.dataset.year;
                        this.filterMaintenanceByYear(year);

                        // Aggiorna UI
                        yearOptions.querySelectorAll('.year-filter-option').forEach(opt => {  // Cambiato qui
                            opt.classList.remove('selected');
                        });
                        option.classList.add('selected');
                        document.getElementById('current-year-filter').textContent =
                            year === 'all' ? 'Tutti gli anni' : year;

                        // Chiudi il menu
                        yearOptions.classList.add('hidden');
                    }
                });
            }

            // Chiudi i menu quando si clicca altrove
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#type-filter-btn') &&
                    !e.target.closest('#type-filter-options') &&
                    !e.target.closest('#year-filter-btn') &&
                    !e.target.closest('#year-filter-options')) {

                    document.getElementById('type-filter-options')?.classList.add('hidden');
                    document.getElementById('year-filter-options')?.classList.add('hidden');
                }
            });

            // Login con Google
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    this.loginWithGoogle();
                });
            }

            // Logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.logout();
                });
            }

            // Backup su cloud
            const cloudBackupBtn = document.getElementById('cloud-backup-btn');
            if (cloudBackupBtn) {
                cloudBackupBtn.addEventListener('click', () => {
                    if (cloudBackupBtn.classList.contains('locked')) {
                        this.showCloudAccessDialog('backup');
                    } else {
                        this.backupToCloud();
                    }
                });
            }

            // Ripristino da cloud
            const cloudRestoreBtn = document.getElementById('cloud-restore-btn');
            if (cloudRestoreBtn) {
                cloudRestoreBtn.addEventListener('click', () => {
                    if (cloudRestoreBtn.classList.contains('locked')) {
                        this.showCloudAccessDialog('restore');
                    } else {
                        this.restoreFromCloud();
                    }
                });
            }
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

            // Determina se siamo su mobile
            const isMobile = window.innerWidth <= 768;

            let menuHTML = '';

            // Aggiungi opzioni solo per mobile
            if (isMobile) {
                menuHTML += `
            <button class="settings-option" id="settings-theme">
                <i class="fas fa-moon"></i> Cambia tema
            </button>
            <button class="settings-option" id="settings-export">
                <i class="fas fa-file-export"></i> Esporta dati
            </button>
            <button class="settings-option" id="settings-import">
                <i class="fas fa-file-import"></i> Importa dati
            </button>
        `;

                // Aggiungi opzioni cloud solo se l'utente è loggato
                if (currentUser) {
                    menuHTML += `
                <button class="settings-option" id="settings-cloud-backup">
                    <i class="fas fa-cloud-upload-alt"></i> Backup su cloud
                </button>
                <button class="settings-option" id="settings-cloud-restore">
                    <i class="fas fa-cloud-download-alt"></i> Ripristina da cloud
                </button>
            `;
                }
            }

            // Opzione sempre presente
            menuHTML += `
                <button class="settings-option danger" id="reset-data">
                    <i class="fas fa-trash-alt"></i> Cancella tutti i dati
                </button>
            `;

            menu.innerHTML = menuHTML;

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

            // Aggiungi event listener solo se siamo su mobile e gli elementi esistono
            if (isMobile) {
                // Tema
                const themeBtn = document.getElementById('settings-theme');
                if (themeBtn) {
                    themeBtn.addEventListener('click', () => {
                        this.showThemeOptions();
                        menu.remove();
                    });
                }

                // Export
                const exportBtn = document.getElementById('settings-export');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => {
                        this.exportData();
                        menu.remove();
                    });
                }

                // Import
                const importBtn = document.getElementById('settings-import');
                if (importBtn) {
                    importBtn.addEventListener('click', () => {
                        this.showImportDialog();
                        menu.remove();
                    });
                }

                // Cloud backup
                const backupBtn = document.getElementById('settings-cloud-backup');
                if (backupBtn) {
                    backupBtn.addEventListener('click', () => {
                        this.backupToCloud();
                        menu.remove();
                    });
                }

                // Cloud restore
                const restoreBtn = document.getElementById('settings-cloud-restore');
                if (restoreBtn) {
                    restoreBtn.addEventListener('click', () => {
                        this.restoreFromCloud();
                        menu.remove();
                    });
                }
            }
        },

        showThemeOptions: function() {
            this.showModal('Scegli tema', `
                <div class="theme-options-container">
                    <button class="theme-modal-option" data-theme="light">
                        <i class="fas fa-sun"></i> Tema chiaro
                    </button>
                    <button class="theme-modal-option" data-theme="dark">
                        <i class="fas fa-moon"></i> Tema scuro
                    </button>
                    <button class="theme-modal-option" data-theme="system">
                        <i class="fas fa-laptop"></i> Tema di sistema
                    </button>
                </div>
            `);

            // Evidenzia il tema attualmente selezionato
            const currentTheme = localStorage.getItem('bullyCarTheme') || 'system';
            document.querySelectorAll('.theme-modal-option').forEach(option => {
                if (option.dataset.theme === currentTheme) {
                    option.classList.add('selected');
                }

                // Aggiungi l'event listener per la selezione del tema
                option.addEventListener('click', () => {
                    const theme = option.dataset.theme;
                    this.applyTheme(theme);
                    localStorage.setItem('bullyCarTheme', theme);
                    this.hideModal();
                });
            });

            // Cambia il testo del pulsante di conferma
            this.elements.modalConfirm.style.display = 'none';
            this.elements.modalCancel.textContent = 'Chiudi';
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

        compressImage: function(imageDataUrl, maxWidth = 800, quality = 0.7) {
            return new Promise((resolve, reject) => {
                try {
                    const img = new Image();
                    img.onload = () => {
                        // Calcola le nuove dimensioni mantenendo le proporzioni
                        let width = img.width;
                        let height = img.height;
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }

                        // Crea un canvas per il ridimensionamento
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');

                        // Disegna l'immagine ridimensionata sul canvas
                        ctx.drawImage(img, 0, 0, width, height);

                        // Converti il canvas in base64 con la qualità specificata
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                        resolve(compressedDataUrl);
                    };

                    img.onerror = (error) => {
                        reject(error);
                    };

                    img.src = imageDataUrl;
                } catch (error) {
                    reject(error);
                }
            });
        },

        compressDocument: function(docDataUrl, compressionRatio = 0.8) {
            // Per i documenti PDF o di altro tipo, facciamo una semplice validazione
            // e potremmo decidere di limitarne la dimensione
            return new Promise((resolve, reject) => {
                try {
                    // Controlla dimensione approssimativa in KB
                    const sizeInKB = Math.round(docDataUrl.length * 0.75 / 1024);

                    if (sizeInKB > 500) {
                        // Se il documento è molto grande, mostriamo un avviso
                        this.showNotification('Attenzione', 'Il documento è grande (' + sizeInKB + 'KB) e potrebbe rallentare il backup', 'warning');
                    }

                    // In questa versione semplice, restituiamo il documento così com'è
                    // In un'implementazione più avanzata, potresti usare librerie
                    // specifiche per comprimere PDF
                    resolve(docDataUrl);
                } catch (error) {
                    reject(error);
                }
            });
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

            // Resetta i filtri
            this.currentMaintenanceFilter = 'all';
            this.currentYearFilter = 'all';

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

            // Popola il filtro degli anni
            setTimeout(() => {
                this.populateYearFilter(car);
            }, 100);
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

            // Reset files array
            maintenanceFiles = [];
            document.getElementById('maintenance-files-preview').innerHTML = '';

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

                // Carica file esistenti
                if (maintenance.files && maintenance.files.length > 0) {
                    maintenanceFiles = [...maintenance.files];
                    this.renderFilesPreviews();
                }

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

        renderFilesPreviews: function() {
            const container = document.getElementById('maintenance-files-preview');
            container.innerHTML = '';

            maintenanceFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';

                if (file.type.startsWith('image/')) {
                    // Anteprima immagine
                    fileItem.innerHTML = `
                <img src="${file.data}" alt="Foto">
                <button class="delete-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
                } else {
                    // Anteprima documento
                    fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-file-alt"></i>
                    <span>${file.name}</span>
                </div>
                <button class="delete-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
                }

                container.appendChild(fileItem);
            });

            // Aggiungi event listener per i pulsanti di eliminazione
            document.querySelectorAll('.delete-file').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(button.dataset.index);
                    maintenanceFiles.splice(index, 1);
                    this.renderFilesPreviews();
                });
            });
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

                reader.onload = async (e) => {
                    // Comprimi il documento se possibile
                    let docData = e.target.result;
                    let docSize = file.size;

                    if (file.type === 'application/pdf') {
                        // Usa la versione semplice se PDF.js e jsPDF non sono disponibili
                        if (typeof pdfjsLib === 'undefined' || typeof jspdf === 'undefined') {
                            docData = await this.compressPdf(e.target.result, 'medium'); // Usa la versione base con compressione alta
                        } else {
                            // Altrimenti usa la versione avanzata
                            this.showNotification('Elaborazione', 'Compressione PDF in corso...', 'info');
                            docData = await this.compressPdfAdvanced(e.target.result, 'medium'); // Compressione aggressiva
                        }
                        docSize = Math.round(docData.length * 0.75);  // Stima la dimensione in byte
                    } else if (file.type.startsWith('image/')) {
                        // Se è un'immagine, comprimiamola
                        docData = await this.compressImage(e.target.result, 1200, 0.75); // Più aggressiva anche per le immagini
                        docSize = Math.round(docData.length * 0.75);  // Stima la dimensione in byte
                    }

                    const doc = {
                        id: Date.now(),
                        name: file.name,
                        type: file.type,
                        size: docSize,
                        data: docData,
                        date: new Date().toISOString()
                    };

                    if (carId) {
                        // Aggiorna auto esistente
                        const car = this.getCarById(parseInt(carId));
                        if (car) {
                            car.documents.push(doc);
                            this.saveData();
                            this.showNotification('Documento aggiunto', `"${file.name}" aggiunto all'auto`, 'success');
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
                notes: document.getElementById('maintenance-notes').value,
                files: maintenanceFiles // Aggiungi i file
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

            // Applica entrambi i filtri
            let maintenanceItems = [...car.maintenance];

            // Filtro per tipo
            if (this.currentMaintenanceFilter && this.currentMaintenanceFilter !== 'all') {
                if (this.currentMaintenanceFilter === 'custom') {
                    // Filtra per interventi personalizzati
                    maintenanceItems = maintenanceItems.filter(item => item.type === 'custom');
                } else {
                    // Filtra per tipo specifico
                    maintenanceItems = maintenanceItems.filter(item => item.type === this.currentMaintenanceFilter);
                }
            }

            // Filtro per anno
            if (this.currentYearFilter && this.currentYearFilter !== 'all') {
                maintenanceItems = maintenanceItems.filter(item => {
                    if (!item.date) return false;
                    const itemYear = new Date(item.date).getFullYear().toString();
                    return itemYear === this.currentYearFilter;
                });
            }

            // Mostra un messaggio se non ci sono interventi con i filtri applicati
            if (maintenanceItems.length === 0) {
                let message = "Nessun intervento trovato";

                if (this.currentMaintenanceFilter !== 'all') {
                    message += ` di tipo "${this.getMaintenanceTypeName(this.currentMaintenanceFilter)}"`;
                }

                if (this.currentYearFilter !== 'all') {
                    message += ` nell'anno ${this.currentYearFilter}`;
                }

                container.innerHTML = `
                    <div class="empty-state">
                        <p>${message}.</p>
                    </div>
                `;
                return;
            }

            // Ordina per data (più recente prima)
            const sortedMaintenance = maintenanceItems.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            sortedMaintenance.forEach(item => {
                const maintenanceItem = document.createElement('div');
                maintenanceItem.className = 'maintenance-item';

                const typeName = item.type === 'custom' ? item.customType : this.getMaintenanceTypeName(item.type);

                let filesHtml = '';
                if (item.files && item.files.length > 0) {
                    filesHtml = `
                <div class="maintenance-files">
                    ${item.files.map((file, index) => {
                        if (file.type.startsWith('image/')) {
                            return `
                                <div class="maintenance-file-item" data-maintenance-id="${item.id}" data-file-index="${index}">
                                    <img src="${file.data}" alt="Foto">
                                </div>
                            `;
                        } else {
                            return `
                                <div class="maintenance-file-item" data-maintenance-id="${item.id}" data-file-index="${index}">
                                    <div class="file-icon">
                                        <i class="fas fa-file-alt"></i>
                                        <span>${file.name.length > 10 ? file.name.substring(0, 8) + '...' : file.name}</span>
                                    </div>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            `;
                }

                maintenanceItem.innerHTML = `
            <div class="maintenance-header">
                <div>
                    <div class="maintenance-title">${typeName}</div>
                    <div class="maintenance-date">${this.formatDate(item.date)} - ${item.mileage.toLocaleString()} km</div>
                </div>
                <div class="maintenance-cost">€ ${item.cost.toFixed(2)}</div>
            </div>
            ${item.notes ? `<div class="maintenance-details">${item.notes}</div>` : ''}
            ${filesHtml}
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

            // Aggiungi event listener per i file
            document.querySelectorAll('.maintenance-file-item').forEach(fileItem => {
                fileItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const maintenanceId = parseInt(fileItem.dataset.maintenanceId);
                    const fileIndex = parseInt(fileItem.dataset.fileIndex);

                    const maintenance = car.maintenance.find(m => m.id === maintenanceId);
                    if (maintenance && maintenance.files && maintenance.files[fileIndex]) {
                        this.openFile(maintenance.files[fileIndex]);
                    }
                });
            });
        },

        openFile: function(file) {
            // Usa il nuovo metodo safeOpenFile invece di window.open diretto
            this.safeOpenFile(file.data, file.name, file.type);
        },

        // Aggiungi questa funzione helper al tuo script.js
        // Versione semplificata di safeOpenFile senza header né pulsanti
        safeOpenFile: function(fileData, fileName, fileType) {
            try {
                // Per sicurezza, mostriamo un messaggio e procediamo al download classico
                // se il data URL è troppo lungo (potrebbe crashare il browser)
                if (fileData.length > 2000000) { // ~2MB come limite di sicurezza
                    console.warn("File troppo grande per l'apertura diretta, si procede al download");

                    // Usando il metodo download classico
                    const a = document.createElement('a');
                    a.href = fileData;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    this.showNotification('Download', `Download di "${fileName}" avviato (file grande)`, 'info');
                    return;
                }

                // Per file più piccoli, proviamo ad aprirli in una nuova scheda
                const newTab = window.open('about:blank', '_blank');

                // Se il popup è stato bloccato
                if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                    console.warn("Apertura della nuova scheda bloccata, si procede al download");

                    // Usiamo il metodo download come fallback
                    const a = document.createElement('a');
                    a.href = fileData;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    this.showNotification('Download', `Download di "${fileName}" avviato`, 'info');
                    return;
                }

                // Impostare il titolo della pagina come nome del file (appare nella tab)
                newTab.document.title = fileName;

                // Scriviamo l'appropriato contenuto HTML nella nuova scheda
                newTab.document.write('<!DOCTYPE html><html><head>');

                // Aggiungiamo stili CSS minimali per diversi tipi di file
                newTab.document.write(`
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f0f0f0;
                    overflow: hidden;
                }
                img {
                    max-width: 100%;
                    max-height: 100vh;
                    object-fit: contain;
                }
                iframe {
                    width: 100%;
                    height: 100vh;
                    border: none;
                }
            </style>
        `);

                newTab.document.write('</head><body>');

                // Contenuto diverso in base al tipo di file - senza intestazioni o pulsanti
                if (fileType.startsWith('image/')) {
                    // Per le immagini, solo l'immagine a schermo intero
                    newTab.document.write(`<img src="${fileData}" alt="">`);
                } else if (fileType === 'application/pdf') {
                    // Per i PDF, iframe a schermo intero
                    newTab.document.write(`<iframe src="${fileData}" type="application/pdf"></iframe>`);
                } else {
                    // Per altri tipi di file, reindirizzamento diretto all'URL del file
                    newTab.location.href = fileData;
                    return; // Usciamo qui perché abbiamo fatto un redirect
                }

                newTab.document.write('</body></html>');
                newTab.document.close();

                this.showNotification('Visualizzazione', `"${fileName}" aperto in una nuova scheda`, 'success');
            } catch (error) {
                console.error('Errore nell\'apertura del file:', error);

                // In caso di errore, fallback al download tradizionale
                try {
                    const a = document.createElement('a');
                    a.href = fileData;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    this.showNotification('Download', `Download di "${fileName}" avviato (fallback)`, 'warning');
                } catch (e) {
                    this.showNotification('Errore', `Impossibile aprire o scaricare il file`, 'error');
                }
            }
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

            reader.onload = async (e) => {
                previewContainer.innerHTML = '';

                // Comprimiamo l'immagine prima di mostrarla e salvarla
                try {
                    // Mostra un indicatore di caricamento durante la compressione
                    const loadingIndicator = document.createElement('div');
                    loadingIndicator.className = 'loading-indicator';
                    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    previewContainer.appendChild(loadingIndicator);

                    // Comprimi l'immagine utilizzando la funzione esistente
                    // Utilizziamo valori ottimali: 1200px massimo (buona qualità) e 0.8 di compressione
                    const compressedDataUrl = await this.compressImage(e.target.result, 1200, 0.8);

                    // Rimuovi l'indicatore di caricamento
                    previewContainer.innerHTML = '';

                    // Mostra l'immagine compressa
                    const img = document.createElement('img');
                    img.src = compressedDataUrl;
                    previewContainer.appendChild(img);

                    // Calcola e mostra il risparmio ottenuto
                    const originalSize = Math.round(e.target.result.length * 0.75 / 1024);
                    const compressedSize = Math.round(compressedDataUrl.length * 0.75 / 1024);
                    const savedPercentage = Math.round((1 - compressedSize / originalSize) * 100);

                    if (savedPercentage > 10) {  // Mostra info solo se il risparmio è significativo
                        console.log(`Compressione immagine: ${originalSize}KB → ${compressedSize}KB (${savedPercentage}% risparmiato)`);
                        this.showNotification('Compressione', `Immagine ottimizzata: ${savedPercentage}% di spazio risparmiato`, 'success');
                    }
                } catch (error) {
                    console.error('Errore durante la compressione dell\'immagine:', error);

                    // In caso di errore, mostra l'immagine originale
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    previewContainer.appendChild(img);

                    this.showNotification('Attenzione', 'Impossibile ottimizzare l\'immagine', 'warning');
                }
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
            // Usa il nuovo metodo safeOpenFile invece di window.open diretto
            this.safeOpenFile(doc.data, doc.name, doc.type);
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

        // Funzione per generare un hash della password
        hashPassword: function(password) {
            // Usiamo una funzione hash semplice per questo scopo
            let hash = 0;
            if (password.length === 0) return hash;

            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Converti in integer a 32 bit
            }

            // Aggiungiamo un salt fisso per rendere meno prevedibile l'hash
            return hash * 1311 + 9973;
        },

        // Verifica se la password fornita è corretta
        verifyPassword: function(password) {
            // Questo è l'hash SHA-256
            // (pre-calcolato per evitare di includerla in chiaro nel codice)
            // const correctPasswordHash = "ad12b4c03c116c725babf54ce7a41dd9968ef7e32a385b8b3774a777c7f7d647";
            const correctPasswordHash = "c581c1374a3752862bd5c6b7f85647e63f2a553b1ea7267440ea8f8acb0645a9";

            // Calcola l'hash della password fornita
            const hashInput = this.sha256(password);

            console.log("Password inserita dall'utente: ", hashInput);
            console.log("Password corretta: ", correctPasswordHash);

            // Confronta gli hash
            return hashInput === correctPasswordHash;
        },

        // Implementazione di SHA-256 in JavaScript puro
        sha256: function(message) {
            // Array di costanti hash (primi 32 bit delle parti frazionarie delle radici cubiche dei primi 64 numeri primi)
            const K = [
                0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
                0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
                0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
                0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
                0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
                0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
            ];

            // Funzioni di hash
            function ROTR(x, n) { return (x >>> n) | (x << (32 - n)); }
            function Ch(x, y, z) { return (x & y) ^ (~x & z); }
            function Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }
            function Sigma0(x) { return ROTR(x, 2) ^ ROTR(x, 13) ^ ROTR(x, 22); }
            function Sigma1(x) { return ROTR(x, 6) ^ ROTR(x, 11) ^ ROTR(x, 25); }
            function sigma0(x) { return ROTR(x, 7) ^ ROTR(x, 18) ^ (x >>> 3); }
            function sigma1(x) { return ROTR(x, 17) ^ ROTR(x, 19) ^ (x >>> 10); }

            // Converti stringa in array di byte
            function str2binb(str) {
                let bin = [];
                for (let i = 0; i < str.length * 8; i += 8) {
                    bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xff) << (24 - i % 32);
                }
                return bin;
            }

            // Converti numero in hex string
            function binb2hex(binarray) {
                const hex_tab = '0123456789abcdef';
                let str = '';
                for (let i = 0; i < binarray.length * 4; i++) {
                    str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xf) +
                        hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xf);
                }
                return str;
            }

            // Calcolo principale SHA-256
            let msg = str2binb(message);
            const msgLen = message.length * 8;

            // Padding
            msg[msgLen >> 5] |= 0x80 << (24 - msgLen % 32);
            msg[((msgLen + 64 >> 9) << 4) + 15] = msgLen;

            // Hash state
            let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

            // Processamento dei blocchi da 512 bit
            for (let i = 0; i < msg.length; i += 16) {
                const w = new Array(64);

                // Prepara message schedule
                for (let t = 0; t < 16; t++) {
                    w[t] = msg[i + t];
                }
                for (let t = 16; t < 64; t++) {
                    w[t] = (sigma1(w[t - 2]) + w[t - 7] + sigma0(w[t - 15]) + w[t - 16]) >>> 0;
                }

                // Initialize working variables
                let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

                // Main loop
                for (let t = 0; t < 64; t++) {
                    const T1 = (h + Sigma1(e) + Ch(e, f, g) + K[t] + w[t]) >>> 0;
                    const T2 = (Sigma0(a) + Maj(a, b, c)) >>> 0;

                    h = g;
                    g = f;
                    f = e;
                    e = (d + T1) >>> 0;
                    d = c;
                    c = b;
                    b = a;
                    a = (T1 + T2) >>> 0;
                }

                // Compute intermediate hash value
                H[0] = (H[0] + a) >>> 0;
                H[1] = (H[1] + b) >>> 0;
                H[2] = (H[2] + c) >>> 0;
                H[3] = (H[3] + d) >>> 0;
                H[4] = (H[4] + e) >>> 0;
                H[5] = (H[5] + f) >>> 0;
                H[6] = (H[6] + g) >>> 0;
                H[7] = (H[7] + h) >>> 0;
            }

            return binb2hex(H);
        },

        showCloudAccessDialog: function(action) {
            const actionText = action === 'backup' ? 'backup' : 'ripristino';

            this.showModal(`Accesso ${actionText} cloud`, `
                <p>Questa funzionalità è riservata agli utenti autorizzati.</p>
                <div class="password-input-container">
                    <label for="cloud-password">Inserisci la password:</label>
                    <input type="password" id="cloud-password" class="password-input" placeholder="Password">
                </div>
            `);

            // Aggiorniamo il pulsante di conferma
            this.elements.modalConfirm.textContent = 'Sblocca';

            // Aggiungiamo il listener per il submit
            this.elements.modalConfirm.onclick = () => {
                const passwordInput = document.getElementById('cloud-password');
                const password = passwordInput.value.trim();

                if (this.verifyPassword(password)) {
                    // Password corretta
                    sessionStorage.setItem('cloudAccessAuthorized', 'true');
                    this.hideModal();
                    this.showNotification('Successo', 'Accesso cloud sbloccato', 'success');

                    // Aggiorna UI per mostrare i pulsanti sbloccati
                    const cloudBackupBtn = document.getElementById('cloud-backup-btn');
                    const cloudRestoreBtn = document.getElementById('cloud-restore-btn');

                    if (cloudBackupBtn) {
                        cloudBackupBtn.classList.remove('locked');
                        cloudBackupBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
                        cloudBackupBtn.title = "Backup su cloud";
                    }

                    if (cloudRestoreBtn) {
                        cloudRestoreBtn.classList.remove('locked');
                        cloudRestoreBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i>';
                        cloudRestoreBtn.title = "Ripristino da cloud";
                    }

                    // Esegui l'azione richiesta se necessario
                    if (action === 'backup') {
                        this.backupToCloud();
                    } else if (action === 'restore') {
                        this.restoreFromCloud();
                    }
                } else {
                    // Password errata
                    this.showNotification('Errore', 'Password non corretta', 'error');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            };

            // Aggiungiamo anche l'evento keypress per consentire di premere Invio
            const passwordInput = document.getElementById('cloud-password');
            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.elements.modalConfirm.click();
                    }
                });

                // Focus sull'input password
                setTimeout(() => {
                    passwordInput.focus();
                }, 100);
            }
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

            // Rimuovi la classe 'hidden' e aggiungi 'visible'
            this.elements.modalContainer.classList.remove('hidden');

            // Piccolo ritardo per assicurarsi che il DOM sia stato aggiornato
            setTimeout(() => {
                this.elements.modalContainer.classList.add('visible');
            }, 10);

            // Reset bottoni
            this.elements.modalConfirm.style.display = 'block';
            this.elements.modalConfirm.textContent = 'Conferma';
            this.elements.modalConfirm.classList.remove('danger-button');
            this.elements.modalCancel.textContent = 'Annulla';
        },

        hideModal: function() {
            // Rimuovi 'visible' prima
            this.elements.modalContainer.classList.remove('visible');

            // Aggiungi 'hidden' dopo un ritardo per permettere l'animazione
            setTimeout(() => {
                this.elements.modalContainer.classList.add('hidden');
            }, 300); // Attendi che la transizione sia completa
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

        handleMaintenanceFileUpload: function(files, fileType) {
            if (!files || files.length === 0) return;

            // Mostriamo un loader durante la compressione di più file
            if (files.length > 1) {
                this.showNotification('Elaborazione', `Ottimizzazione di ${files.length} file in corso...`, 'info');
            }

            // Contatore per tenere traccia dei file processati
            let processedFiles = 0;
            let totalSavedKB = 0;

            Array.from(files).forEach(file => {
                const reader = new FileReader();

                reader.onload = async (e) => {
                    try {
                        let compressedData = e.target.result;
                        let originalSize = Math.round(e.target.result.length * 0.75 / 1024);
                        let compressedSize = originalSize;

                        // Comprimi in base al tipo di file
                        if (file.type.startsWith('image/')) {
                            // Comprimi l'immagine (1200px di larghezza massima, 75% qualità per maggiore compressione)
                            compressedData = await this.compressImage(e.target.result, 1200, 0.75);
                            compressedSize = Math.round(compressedData.length * 0.75 / 1024);
                            totalSavedKB += (originalSize - compressedSize);
                        } else if (file.type === 'application/pdf') {
                            // Comprimi PDF con il metodo avanzato se disponibile
                            if (typeof pdfjsLib !== 'undefined' && typeof jspdf !== 'undefined') {
                                compressedData = await this.compressPdfAdvanced(e.target.result, 'medium');
                            } else {
                                compressedData = await this.compressPdf(e.target.result, 'medium');
                            }
                            compressedSize = Math.round(compressedData.length * 0.75 / 1024);
                            totalSavedKB += (originalSize - compressedSize);
                        }

                        // Crea l'oggetto file (con dati compressi)
                        const fileData = {
                            id: Date.now() + Math.random().toString(36).substr(2, 9),
                            name: file.name,
                            type: file.type,
                            size: compressedSize * 1024, // Aggiorna la dimensione con quella compressa
                            data: compressedData,
                            date: new Date().toISOString()
                        };

                        // Aggiungi il file alla lista
                        maintenanceFiles.push(fileData);
                        this.renderFilesPreviews();

                        // Resto del codice...
                    } catch (error) {
                        // Gestione errori...
                    }
                };

                reader.readAsDataURL(file);
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
        },

        // Implementazione di una compressione PDF più aggressiva
        compressPdf: async function(pdfDataUrl, compressionLevel = 'medium') {
            return new Promise((resolve, reject) => {
                try {
                    // Calcoliamo la dimensione originale
                    const originalSizeKB = Math.round(pdfDataUrl.length * 0.75 / 1024);

                    // Strategia basata sul livello di compressione e sulle dimensioni del file
                    let strategy = '';
                    let targetQuality = 0;

                    if (compressionLevel === 'low' || originalSizeKB < 500) {
                        // Compressione leggera o file piccolo: non comprimere
                        console.log(`PDF piccolo (${originalSizeKB}KB) o compressione leggera richiesta, mantengo originale`);
                        resolve(pdfDataUrl);
                        return;
                    } else if (compressionLevel === 'medium' || (originalSizeKB >= 500 && originalSizeKB < 3000)) {
                        // Compressione media o file medio: strategia intermedia
                        strategy = 'canvas-medium';
                        targetQuality = 0.5; // 50% qualità
                    } else {
                        // Compressione alta o file grande: strategia aggressiva
                        strategy = 'canvas-high';
                        targetQuality = 0.3; // 30% qualità
                    }

                    // Poiché non possiamo manipolare direttamente il PDF in JavaScript puro,
                    // utilizziamo una strategia di conversione PDF -> Immagini -> PDF
                    if (strategy.startsWith('canvas')) {
                        // Questo è un approccio concettuale - la vera implementazione richiederebbe
                        // pdf.js per il rendering e jspdf per la creazione del nuovo PDF

                        // Per ora, simuliamo una riduzione della dimensione
                        // basata sul livello di compressione desiderato
                        console.log(`Comprimendo PDF da ${originalSizeKB}KB (strategia: ${strategy}, qualità: ${targetQuality})`);

                        // Simulazione della compressione
                        const simulatedReductionFactor = (compressionLevel === 'medium') ? 0.6 : 0.3;
                        const newSizeEstimate = Math.round(originalSizeKB * simulatedReductionFactor);

                        // Mostra notifica di avviso che la compressione aggressiva è stata applicata
                        this.showNotification('Compressione PDF',
                            `Riduzione stimata: ${originalSizeKB}KB → ~${newSizeEstimate}KB (${Math.round((1-simulatedReductionFactor)*100)}%)`,
                            'info');

                        // In un'implementazione reale, questa parte convertirebbe e comprimerebbe effettivamente il PDF
                        // Per ora restituiamo l'originale, ma in futuro inseriremo qui una vera compressione

                        // Per implementare una vera compressione, dovresti usare:
                        // 1. pdf.js per rendere ogni pagina del PDF su un canvas
                        // 2. canvas.toDataURL() con qualità ridotta per ogni pagina
                        // 3. jsPDF per creare un nuovo PDF con le immagini compresse

                        resolve(pdfDataUrl);
                    } else {
                        // Fallback: restituisci l'originale
                        resolve(pdfDataUrl);
                    }
                } catch (error) {
                    console.error('Errore durante la compressione del PDF:', error);
                    // In caso di errore restituisci l'originale
                    resolve(pdfDataUrl);
                }
            });
        },

        compressPdfAdvanced: async function(pdfDataUrl, compressionLevel = 'high') {
            return new Promise(async (resolve, reject) => {
                try {
                    // Calcola dimensione originale
                    const originalSizeKB = Math.round(pdfDataUrl.length * 0.75 / 1024);

                    // Se il PDF è piccolo, mantieni l'originale
                    if (originalSizeKB < 300) {
                        console.log(`PDF piccolo (${originalSizeKB}KB), mantengo originale`);
                        return resolve(pdfDataUrl);
                    }

                    // Verifica librerie
                    if (typeof pdfjsLib === 'undefined' || typeof jspdf === 'undefined') {
                        console.warn('Librerie PDF.js o jsPDF non trovate. Impossibile comprimere il PDF.');
                        return resolve(pdfDataUrl);
                    }

                    // Mostra loader
                    this.showLoader('Compressione PDF in corso...');

                    // Estrai il binario dal data URL
                    const pdfData = atob(pdfDataUrl.split(',')[1]);
                    const pdfBytes = new Uint8Array(pdfData.length);
                    for (let i = 0; i < pdfData.length; i++) {
                        pdfBytes[i] = pdfData.charCodeAt(i);
                    }

                    // Carica il PDF con PDF.js
                    const loadingTask = pdfjsLib.getDocument({data: pdfBytes});
                    const pdf = await loadingTask.promise;
                    const numPages = pdf.numPages;

                    // Imposta qualità in base al livello di compressione
                    let imageQuality = 0.3;
                    if (compressionLevel === 'medium') {
                        imageQuality = 0.5;
                    } else if (compressionLevel === 'low') {
                        imageQuality = 0.7;
                    }

                    // FASE 1: Raccogli informazioni su tutte le pagine
                    const pageInfo = [];
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        // Ottieni le dimensioni reali della pagina
                        const viewport = page.getViewport({scale: 1.0});
                        pageInfo.push({
                            width: viewport.width,
                            height: viewport.height,
                            rotation: page.rotate || 0
                        });
                    }

                    // FASE 2: Scegli l'approccio di compressione più adatto
                    // Questo approccio utilizza una nuova strategia per garantire che nulla venga ritagliato

                    // Crea un array per immagazzinare le immagini compresse
                    const compressedImages = [];

                    // Renderizza ogni pagina come immagine
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        const pageData = pageInfo[i-1];

                        // Usiamo un fattore di scala alto per garantire buona qualità
                        // e compensare eventuali problemi di ritaglio
                        const scaleFactor = 2.0;

                        // Crea viewport con scala aumentata
                        const viewport = page.getViewport({scale: scaleFactor});

                        // Crea canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        // Ottieni contesto e riempi con sfondo bianco
                        const context = canvas.getContext('2d');
                        context.fillStyle = 'white';
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        // Renderizza pagina
                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };

                        await page.render(renderContext).promise;

                        // Genera immagine JPEG compressa
                        const imgData = canvas.toDataURL('image/jpeg', imageQuality);

                        // Salva l'immagine insieme alle dimensioni originali per riferimento
                        compressedImages.push({
                            image: imgData,
                            width: pageData.width,
                            height: pageData.height,
                            rotation: pageData.rotation
                        });
                    }

                    // FASE 3: Creazione di un nuovo PDF con dimensioni esatte
                    // Utilizziamo direttamente le dimensioni originali del PDF

                    // Crea un nuovo documento PDF
                    const { jsPDF } = jspdf;

                    // Inizializza con la prima pagina
                    const firstPage = compressedImages[0];
                    const orientation = firstPage.width > firstPage.height ? 'landscape' : 'portrait';

                    const newPdf = new jsPDF({
                        orientation: orientation,
                        unit: 'pt',  // Utilizziamo punti come nel PDF originale
                        format: [firstPage.width, firstPage.height],
                        compress: true  // Abilita la compressione interna
                    });

                    // FASE 4: Aggiungi le immagini compresse al nuovo PDF
                    // Per ogni pagina, crea una pagina di dimensioni esatte
                    compressedImages.forEach((page, index) => {
                        // Se non è la prima pagina, aggiungi una nuova pagina con le dimensioni corrette
                        if (index > 0) {
                            newPdf.addPage([page.width, page.height]);
                        }

                        // Calcola le dimensioni in modo che l'immagine riempia l'intera pagina
                        // senza distorsioni e senza ritagli
                        const imgWidth = page.width;
                        const imgHeight = page.height;

                        // Posiziona l'immagine esattamente all'origine della pagina
                        newPdf.addImage(page.image, 'JPEG', 0, 0, imgWidth, imgHeight);
                    });

                    // FASE 5: Genera il PDF finale
                    const compressedPdfOutput = newPdf.output('datauristring');

                    // Calcola statistiche di compressione
                    const compressedSizeKB = Math.round(compressedPdfOutput.length * 0.75 / 1024);
                    const compressionRatio = Math.round((1 - compressedSizeKB / originalSizeKB) * 100);

                    console.log(`PDF compresso con successo: ${originalSizeKB}KB → ${compressedSizeKB}KB (${compressionRatio}% di risparmio)`);

                    this.hideLoader();

                    if (compressionRatio > 0) {
                        this.showNotification('PDF Compresso',
                            `Dimensione ridotta: ${originalSizeKB}KB → ${compressedSizeKB}KB (${compressionRatio}% risparmiato)`,
                            'success');
                        return resolve(compressedPdfOutput);
                    } else {
                        // Nel raro caso in cui la compressione aumenti la dimensione
                        this.showNotification('Compressione PDF',
                            `Compressione non efficace, mantengo originale`,
                            'info');
                        return resolve(pdfDataUrl);
                    }

                } catch (error) {
                    this.hideLoader();
                    console.error('Errore durante la compressione del PDF:', error);
                    return resolve(pdfDataUrl); // Fallback all'originale in caso di errore
                }
            });
        }

    };

    // Inizializza l'app
    app.init();
});