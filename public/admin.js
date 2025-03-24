// Simplified admin panel without login
document.addEventListener('DOMContentLoaded', function() {
    // Global variables and config
    const SUPABASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDA3OTYsImV4cCI6MjA1ODA3Njc5Nn0.2qrrNC2bKichC63SvUhNgXlcG0ElViRsqM5CYU3QSfg';
    
    // Debug flag - set to true for console logs
    const DEBUG = true;
    
    // DOM Elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const toastContainer = document.getElementById('toastContainer');
    
    // Utility Functions
    function debug(message) {
        if (DEBUG) {
            console.log(message);
        }
    }
    
    const VERSION = new Date().getTime(); // Add cache-busting version
    
    // Function to add cache-busting to API URLs
    function addCacheBuster(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}cachebust=${Date.now()}`;
    }

    function formatCurrency(amount) {
        return '€' + parseFloat(amount).toFixed(2).replace('.', ',');
    }

    function formatDate(dateString) {
        if (!dateString) return 'Onbekend';
        try {
            const date = new Date(dateString);
            const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
            return date.toLocaleDateString('nl-NL', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Ongeldige datum';
        }
    }

    function showLoading(show = true) {
        if (loadingSpinner) {
            if (show) {
                loadingSpinner.classList.remove('hidden');
            } else {
                loadingSpinner.classList.add('hidden');
            }
        }
    }
    
    function showToast(message, type = 'info') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `rounded-lg p-4 mb-3 text-white text-sm flex items-center justify-between shadow-lg transform transition-all duration-300 ease-in-out opacity-0 translate-x-full`;
        
        // Set color based on type
        switch (type) {
            case 'success':
                toast.classList.add('bg-green-600');
                break;
            case 'error':
                toast.classList.add('bg-red-600');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-600');
                break;
            default:
                toast.classList.add('bg-primary-600');
        }
        
        // Add message and close button
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-3"></i>
                <span>${message}</span>
            </div>
            <button class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to DOM
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 10);
        
        // Setup close button
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
        
        // Auto close after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
    
    // Tab functionality
    function setupTabs() {
        const tabBoetes = document.getElementById('tab-boetes');
        const tabBeheer = document.getElementById('tab-beheer');
        const finesTab = document.getElementById('finesTab');
        const beheerTab = document.getElementById('beheerTab');
        
        debug('Setting up tabs');
        
        if (!tabBoetes || !tabBeheer || !finesTab || !beheerTab) {
            debug('Tab elements missing!');
            return;
        }
        
        function activateTab(tabId) {
            // Reset all tabs
            [tabBoetes, tabBeheer].forEach(tab => {
                tab.classList.remove('active');
            });
            
            [finesTab, beheerTab].forEach(content => {
                content.classList.remove('active');
            });
            
            // Activate selected tab
            if (tabId === 'beheer') {
                tabBeheer.classList.add('active');
                beheerTab.classList.add('active');
                localStorage.setItem('activeTab', 'beheer');
            } else {
                // Default to fines tab
                tabBoetes.classList.add('active');
                finesTab.classList.add('active');
                localStorage.setItem('activeTab', 'boetes');
            }
            
            debug(`Activated tab: ${tabId}`);
        }
        
        // Set default active tab from localStorage or default to fines
        const activeTab = localStorage.getItem('activeTab') || 'boetes';
        activateTab(activeTab);
        
        // Add event listeners to tabs
        tabBoetes.addEventListener('click', () => activateTab('boetes'));
        tabBeheer.addEventListener('click', () => activateTab('beheer'));
        
        debug('Tab event listeners attached');
    }
    
    // API & Data Functions - Direct API connection to Supabase
    async function apiRequest(endpoint, options = {}) {
        try {
            showLoading(true);
            
            // Ensure endpoint starts with '/' if not already
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
            
            // Add the REST API path prefix
            if (!endpoint.startsWith('/rest/v1')) {
                endpoint = '/rest/v1' + endpoint;
            }
            
            // Make sure query parameters are properly formatted
            let url = SUPABASE_URL + endpoint;
            
            // Apply cache busting
            const timestamp = Date.now();
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}cachebust=${timestamp}`;
            
            if (DEBUG) console.log('API Request to:', url);
            
            const defaultOptions = {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                mode: 'cors',
                credentials: 'omit' // Don't send cookies
            };
            
            const requestOptions = { ...defaultOptions, ...options };
            
            // Add retry logic for network issues
            let retries = 3;
            let response = null;
            
            while (retries > 0) {
                try {
                    if (DEBUG) console.log(`API request attempt ${4-retries}/3`);
                    response = await fetch(url, requestOptions);
                    break; // If successful, exit the retry loop
                } catch (fetchError) {
                    console.error(`Fetch attempt ${4-retries} failed:`, fetchError);
                    retries--;
                    if (retries === 0) throw fetchError;
                    // Wait before retrying (exponential backoff)
                    const waitTime = (4 - retries) * 1000;
                    console.log(`Retrying in ${waitTime/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
            
            if (!response) {
                throw new Error('Network error after multiple retries');
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response Error:', response.status, errorText);
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }
            
            // If response is 204 No Content or a DELETE request, return empty success object
            if (response.status === 204 || options.method === 'DELETE') {
                return { success: true };
            }
            
            // Parse JSON
            const data = await response.json();
            if (DEBUG) console.log('API Response Data:', data);
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            
            // More detailed error message to help with debugging
            let errorMessage = 'Fout bij verbinden met de database. ';
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage += 'Controleer uw internetverbinding en API-instellingen.';
                
                // Log detailed debugging information
                console.log('Debug info:');
                console.log('API Base URL:', SUPABASE_URL);
                console.log('API Key (masked):', SUPABASE_KEY.substring(0, 15) + '...');
                console.log('Headers:', options.headers);
            } else {
                errorMessage += error.message;
            }
            
            showToast(errorMessage, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    // Data loading functions
    async function loadPlayers() {
        try {
            showLoading(true);
            debug('Loading players...');
            
            const players = await apiRequest('/players?select=*', { method: 'GET' });
            renderPlayersList(players);
            
            return players;
        } catch (error) {
            console.error('Error loading players:', error);
            showToast('Fout bij het laden van spelers', 'error');
            return [];
        } finally {
            showLoading(false);
        }
    }

    async function loadReasons() {
        try {
            showLoading(true);
            debug('Loading reasons...');
            
            const reasons = await apiRequest('/reasons?select=*', { method: 'GET' });
            renderReasonsList(reasons);
            
            return reasons;
        } catch (error) {
            console.error('Error loading reasons:', error);
            showToast('Fout bij het laden van redenen', 'error');
            return [];
        } finally {
            showLoading(false);
        }
    }
    
    async function loadFines() {
        try {
            showLoading(true);
            debug('Loading fines...');
            
            const fines = await apiRequest('/fines?select=*,player:player_id(name),reason:reason_id(description,amount)&order=created_at.desc', { method: 'GET' });
            renderFinesList(fines);
            
            return fines;
        } catch (error) {
            console.error('Error loading fines:', error);
            showToast('Fout bij het laden van boetes', 'error');
            return [];
        } finally {
            showLoading(false);
        }
    }
    
    async function loadAllData() {
        debug('Loading all data...');
        try {
            await Promise.all([
                loadPlayers(),
                loadReasons(),
                loadFines()
            ]);
            debug('All data loaded successfully');
        } catch (error) {
            debug(`Error loading data: ${error.message}`);
            showToast('Er is een fout opgetreden bij het laden van gegevens', 'error');
        }
    }
    
    // UI Rendering Functions
    function renderFinesList(fines) {
        const container = document.getElementById('recentFines');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!fines || fines.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen boetes gevonden</p>
                </div>
            `;
            return;
        }
        
        fines.slice(0, 10).forEach(fine => {
            const fineCard = document.createElement('div');
            fineCard.className = 'fine-card bg-white p-4 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all mb-3';
            
            fineCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="flex items-center mb-1">
                            <span class="font-medium text-gray-800">${fine.player?.name || 'Onbekend'}</span>
                            <span class="text-gray-400 mx-2">•</span>
                            <span class="text-gray-500 text-sm">${formatDate(fine.created_at)}</span>
                        </div>
                        <div class="text-gray-700">${fine.reason?.description || 'Onbekende reden'}</div>
                    </div>
                    <div class="flex items-center">
                        <div class="font-bold text-primary-600 text-lg mr-4">${formatCurrency(fine.reason?.amount || 0)}</div>
                        <button data-fine-id="${fine.id}" class="delete-fine-btn text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listener for delete button
            const deleteBtn = fineCard.querySelector('.delete-fine-btn');
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
                    await deleteFine(fine.id);
                }
            });
            
            container.appendChild(fineCard);
        });
    }
    
    function renderPlayersList(players) {
        const container = document.getElementById('playersList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!players || players.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen spelers gevonden</p>
                </div>
            `;
            return;
        }
        
        const addPlayerForm = document.createElement('div');
        addPlayerForm.className = 'mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200';
        addPlayerForm.innerHTML = `
            <h3 class="font-semibold text-gray-800 mb-3">Nieuwe speler toevoegen</h3>
            <div class="flex gap-2">
                <input type="text" id="newPlayerName" placeholder="Naam van speler" class="flex-1 rounded-lg border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200">
                <button id="addPlayerBtn" class="gradient-bg text-white py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                    <i class="fas fa-plus mr-1"></i> Toevoegen
                </button>
            </div>
        `;
        container.appendChild(addPlayerForm);
        
        // Add event listener for add player button
        const addPlayerBtn = document.getElementById('addPlayerBtn');
        const newPlayerNameInput = document.getElementById('newPlayerName');
        
        if (addPlayerBtn && newPlayerNameInput) {
            addPlayerBtn.addEventListener('click', async () => {
                const playerName = newPlayerNameInput.value.trim();
                if (playerName) {
                    const success = await addPlayer(playerName);
                    if (success) {
                        newPlayerNameInput.value = '';
                    }
                } else {
                    showToast('Voer een geldige spelernaam in', 'warning');
                }
            });
            
            // Allow enter key to submit
            newPlayerNameInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addPlayerBtn.click();
                }
            });
        }
        
        // Player list heading
        const playersHeading = document.createElement('h3');
        playersHeading.className = 'font-semibold text-gray-800 mb-3 mt-6';
        playersHeading.textContent = `Spelers (${players.length})`;
        container.appendChild(playersHeading);
        
        // Create list container
        const playerListContainer = document.createElement('div');
        playerListContainer.className = 'space-y-2';
        container.appendChild(playerListContainer);
        
        // Sort players by name and add to list
        players.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center hover:bg-gray-50 transition-all';
            
            playerItem.innerHTML = `
                <span class="font-medium text-gray-700">${player.name}</span>
                <button class="delete-player-btn text-gray-400 hover:text-red-600 transition-colors" data-player-id="${player.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            playerListContainer.appendChild(playerItem);
        });
        
        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-player-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = this.getAttribute('data-player-id');
                if (confirm(`Weet je zeker dat je deze speler wilt verwijderen? Alle boetes van deze speler worden ook verwijderd!`)) {
                    await deletePlayer(id);
                }
            });
        });
    }
    
    function renderReasonsList(reasons) {
        const container = document.getElementById('reasonsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!reasons || reasons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen redenen gevonden</p>
                </div>
            `;
            return;
        }
        
        const addReasonForm = document.createElement('div');
        addReasonForm.className = 'mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200';
        addReasonForm.innerHTML = `
            <h3 class="font-semibold text-gray-800 mb-3">Nieuwe reden toevoegen</h3>
            <div class="space-y-3">
                <input type="text" id="newReasonDescription" placeholder="Omschrijving" class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200">
                <div class="flex gap-2">
                    <input type="number" id="newReasonAmount" min="0" step="0.01" placeholder="Bedrag (€)" class="flex-1 rounded-lg border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200">
                    <button id="addReasonBtn" class="gradient-bg text-white py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-1"></i> Toevoegen
                    </button>
                </div>
            </div>
        `;
        container.appendChild(addReasonForm);
        
        // Add event listener for add reason button
        const addReasonBtn = document.getElementById('addReasonBtn');
        const newReasonDescriptionInput = document.getElementById('newReasonDescription');
        const newReasonAmountInput = document.getElementById('newReasonAmount');
        
        if (addReasonBtn && newReasonDescriptionInput && newReasonAmountInput) {
            addReasonBtn.addEventListener('click', async () => {
                const description = newReasonDescriptionInput.value.trim();
                const amountStr = newReasonAmountInput.value.trim();
                
                if (!description) {
                    showToast('Voer een omschrijving in', 'warning');
                    return;
                }
                
                if (!amountStr) {
                    showToast('Voer een bedrag in', 'warning');
                    return;
                }
                
                const amount = parseFloat(amountStr);
                if (isNaN(amount) || amount < 0) {
                    showToast('Voer een geldig bedrag in', 'warning');
                    return;
                }
                
                const success = await addReason(description, amount);
                if (success) {
                    newReasonDescriptionInput.value = '';
                    newReasonAmountInput.value = '';
                }
            });
            
            // Allow enter key to submit
            const handleEnterKey = async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addReasonBtn.click();
                }
            };
            
            newReasonDescriptionInput.addEventListener('keypress', handleEnterKey);
            newReasonAmountInput.addEventListener('keypress', handleEnterKey);
        }
        
        // Reasons list heading
        const reasonsHeading = document.createElement('h3');
        reasonsHeading.className = 'font-semibold text-gray-800 mb-3 mt-6';
        reasonsHeading.textContent = `Redenen (${reasons.length})`;
        container.appendChild(reasonsHeading);
        
        // Create list container
        const reasonListContainer = document.createElement('div');
        reasonListContainer.className = 'space-y-2';
        container.appendChild(reasonListContainer);
        
        // Sort reasons by description and add to list
        reasons.sort((a, b) => a.description.localeCompare(b.description)).forEach(reason => {
            const reasonItem = document.createElement('div');
            reasonItem.className = 'bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center hover:bg-gray-50 transition-all';
            
            reasonItem.innerHTML = `
                <div>
                    <span class="font-medium text-gray-700">${reason.description}</span>
                    <span class="ml-2 text-primary-600 font-semibold">${formatCurrency(reason.amount)}</span>
                </div>
                <button class="delete-reason-btn text-gray-400 hover:text-red-600 transition-colors" data-reason-id="${reason.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            reasonListContainer.appendChild(reasonItem);
        });
        
        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-reason-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = this.getAttribute('data-reason-id');
                if (confirm(`Weet je zeker dat je deze reden wilt verwijderen? Alle boetes met deze reden worden ook verwijderd!`)) {
                    await deleteReason(id);
                }
            });
        });
    }
    
    // CRUD Operations
    async function addPlayer(name) {
        try {
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                showToast('Ongeldige spelernaam', 'error');
                return false;
            }
            
            showLoading(true);
            debug(`Adding player: ${name}`);
            
            const player = await apiRequest('/players', {
                method: 'POST',
                body: JSON.stringify({ name: name.trim() })
            });
            
            if (player) {
                showToast(`Speler "${name}" toegevoegd`, 'success');
                await loadPlayers();
                return true;
            } else {
                throw new Error('Geen antwoord van server');
            }
        } catch (error) {
            debug(`Failed to add player: ${error.message}`);
            showToast(`Fout bij toevoegen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deletePlayer(id) {
        try {
            showLoading(true);
            debug(`Deleting player with ID: ${id}`);
            
            // Delete player by ID
            await apiRequest(`/players?id=eq.${id}`, {
                method: 'DELETE'
            });
            
            showToast('Speler succesvol verwijderd!', 'success');
            await loadPlayers();
            await loadFines();
            return true;
        } catch (error) {
            debug(`Failed to delete player: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function addReason(description, amount) {
        try {
            if (!description || typeof description !== 'string' || description.trim().length === 0) {
                showToast('Ongeldige omschrijving', 'error');
                return false;
            }
            
            if (isNaN(amount) || amount < 0) {
                showToast('Ongeldig bedrag', 'error');
                return false;
            }
            
            showLoading(true);
            debug(`Adding reason: ${description} with amount: ${amount}`);
            
            const reason = await apiRequest('/reasons', {
                method: 'POST',
                body: JSON.stringify({ 
                    description: description.trim(),
                    amount: amount 
                })
            });
            
            if (reason) {
                showToast(`Reden "${description}" toegevoegd`, 'success');
                await loadReasons();
                return true;
            } else {
                throw new Error('Geen antwoord van server');
            }
        } catch (error) {
            debug(`Failed to add reason: ${error.message}`);
            showToast(`Fout bij toevoegen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteReason(id) {
        try {
            showLoading(true);
            debug(`Deleting reason with ID: ${id}`);
            
            // Delete reason by ID
            await apiRequest(`/reasons?id=eq.${id}`, {
                method: 'DELETE'
            });
            
            showToast('Reden succesvol verwijderd!', 'success');
            await loadReasons();
            await loadFines();
            return true;
        } catch (error) {
            debug(`Failed to delete reason: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteFine(id) {
        try {
            showLoading(true);
            debug(`Deleting fine with ID: ${id}`);
            
            // Delete fine by ID
            await apiRequest(`/fines?id=eq.${id}`, {
                method: 'DELETE'
            });
            
            showToast('Boete succesvol verwijderd!', 'success');
            await loadFines();
            return true;
        } catch (error) {
            debug(`Failed to delete fine: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    // Initialize when DOM is ready
    function initialize() {
        debug('Initializing admin panel');
        
        // Setup tabs
        setupTabs();
        
        // Add event listeners for forms
        document.getElementById('addFineForm')?.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get selected player IDs (supports multiple selections)
            let playerIds = [];
            const playerSelect = document.getElementById('playerSelect');
            
            if (window.$ && $.fn.select2) {
                playerIds = $(playerSelect).val() || [];
            } else if (playerSelect) {
                // Fallback for when Select2 is not available
                Array.from(playerSelect.selectedOptions).forEach(option => {
                    playerIds.push(option.value);
                });
            }
            
            const reasonSelect = document.getElementById('reasonSelect');
            const reasonId = reasonSelect?.value;
            const dateInput = document.getElementById('dateInput');
            const date = dateInput?.value || new Date().toISOString().split('T')[0];
            
            if (playerIds.length === 0) {
                showToast('Selecteer minimaal één speler', 'warning');
                return;
            }
            
            if (!reasonId) {
                showToast('Selecteer een reden voor de boete', 'warning');
                return;
            }
            
            try {
                showLoading(true);
                
                // Add a fine for each selected player
                const finePromises = playerIds.map(playerId => {
                    return apiRequest('/fines', {
                        method: 'POST',
                        body: JSON.stringify({
                            player_id: playerId,
                            reason_id: reasonId,
                            created_at: date
                        })
                    });
                });
                
                await Promise.all(finePromises);
                
                showToast(`${playerIds.length > 1 ? 'Boetes' : 'Boete'} toegevoegd voor ${playerIds.length} ${playerIds.length > 1 ? 'spelers' : 'speler'}`, 'success');
                
                // Reset form
                if (window.$ && $.fn.select2) {
                    $(playerSelect).val(null).trigger('change');
                    $(reasonSelect).val(null).trigger('change');
                } else if (playerSelect && reasonSelect) {
                    playerSelect.value = '';
                    reasonSelect.value = '';
                }
                
                if (dateInput) {
                    dateInput.valueAsDate = new Date();
                }
                
                // Refresh data
                await loadFines();
            } catch (error) {
                console.error('Error adding fines:', error);
                showToast('Fout bij toevoegen van boetes', 'error');
            } finally {
                showLoading(false);
            }
        });
        
        // Initialize Select2 for dropdowns if available
        if (window.$ && $.fn.select2) {
            $('#playerSelect').select2({
                placeholder: 'Selecteer speler(s)',
                allowClear: true,
                width: '100%',
                multiple: true
            });
            
            $('#reasonSelect').select2({
                placeholder: 'Selecteer een reden',
                allowClear: true,
                width: '100%'
            });
            
            // Set default date to today
            document.getElementById('dateInput')?.valueAsDate = new Date();
        }
        
        // Load initial data
        loadAllData();
        
        debug('Admin panel initialized');
    }
    
    // Start initialization
    initialize();
});