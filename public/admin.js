// Simplified admin panel without login
document.addEventListener('DOMContentLoaded', function() {
    // Global variables and config
    const API_BASE_URL = 'https://hfjbkhvwstsjbgmepyxg.supabase.co/rest/v1';
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmamJraHZ3c3RzamJnbWVweXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkwMTAwODcsImV4cCI6MjAwNDU4NjA4N30.thTZjFw9PnLR9KgTkyZQIR7EWy-m5HCkfGVNqrhbDI8';
    
    // Debug flag - set to true for console logs
    const DEBUG = true;
    
    // DOM Elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const debugStatus = document.getElementById('debugStatus');
    
    // Utility Functions
    function debug(message) {
        if (localStorage.getItem('debug') === 'true') {
            console.log(message);
            if (debugStatus) {
                debugStatus.textContent += `\n${message}`;
            }
        }
    }
    
    const VERSION = new Date().getTime(); // Add cache-busting version
    
    // Function to add cache-busting to API URLs
    function addCacheBuster(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}cachebust=${Date.now()}`;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    function formatDate(dateString) {
        if (!dateString) return 'Onbekend';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('nl-NL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(date);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Ongeldige datum';
        }
    }

    function showLoading(show = true) {
        if (loadingSpinner) {
            if (show) {
                loadingSpinner.classList.remove('hidden');
                loadingSpinner.classList.add('flex');
            } else {
                loadingSpinner.classList.remove('flex');
                loadingSpinner.classList.add('hidden');
            }
        }
    }
    
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `p-4 mb-3 rounded-lg shadow-lg flex items-center justify-between max-w-md transition-all duration-500 transform translate-x-full opacity-0`;
        
        // Set color based on type
        if (type === 'success') {
            toast.classList.add('bg-green-500', 'text-white');
        } else if (type === 'error') {
            toast.classList.add('bg-red-500', 'text-white');
        } else {
            toast.classList.add('bg-blue-500', 'text-white');
        }
        
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3"></i>
                <span>${message}</span>
            </div>
            <button class="ml-4 text-white focus:outline-none">
                <i class="fas fa-times"></i>
            </button>
        `;
    
        toastContainer.appendChild(toast);
    
        // Animation
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 10);
        
        // Close button functionality
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 500);
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 5000);
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
                tab.classList.remove('tab-active');
            });
            
            [finesTab, beheerTab].forEach(content => {
                content.classList.add('hidden');
            });
            
            // Activate selected tab
            if (tabId === 'beheer') {
                tabBeheer.classList.add('tab-active');
                beheerTab.classList.remove('hidden');
                localStorage.setItem('activeTab', 'beheer');
            } else {
                // Default to fines tab
                tabBoetes.classList.add('tab-active');
                finesTab.classList.remove('hidden');
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
            const url = addCacheBuster(`${API_BASE_URL}${endpoint}`);
            
            if (DEBUG) console.log('API Request to:', url);
            
            const defaultOptions = {
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                mode: 'cors'
            };
            
            const requestOptions = { ...defaultOptions, ...options };
            
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response Error:', response.status, errorText);
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }
            
            // If response is 204 No Content, return null
            if (response.status === 204) {
                return null;
            }
            
            // Otherwise parse JSON
            const data = await response.json();
            if (DEBUG) console.log('API Response Data:', data);
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            
            // More detailed error message to help with debugging
            let errorMessage = 'Fout bij verbinden met de database. ';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Controleer uw internetverbinding of Supabase server kan niet worden bereikt.';
            } else {
                errorMessage += error.message;
            }
            
            showToast(errorMessage, 'error');
            throw error;
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
            
            const fines = await apiRequest('/fines?select=id,amount,date,player_id,reason_id&order=date.desc', { method: 'GET' });
            
            // Load player and reason data to enrich the fines
            const players = await loadPlayers();
            const reasons = await loadReasons();
            
            // Combine fines with player and reason info
            const enrichedFines = fines.map(fine => {
                const player = players.find(p => p.id === fine.player_id) || { name: 'Unknown' };
                const reason = reasons.find(r => r.id === fine.reason_id) || { description: 'Unknown' };
                
                return {
                    ...fine,
                    playerName: player.name,
                    reasonDescription: reason.description
                };
            });
            
            renderFinesList(enrichedFines);
            
            return enrichedFines;
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
    
    function clearAllData() {
        // Clear UI elements
        const recentFines = document.getElementById('recentFines');
        const playersList = document.getElementById('playersList');
        const reasonsList = document.getElementById('reasonsList');
        
        if (recentFines) recentFines.innerHTML = '';
        if (playersList) playersList.innerHTML = '';
        if (reasonsList) reasonsList.innerHTML = '';
        
        // Reset selects
        const playerSelect = document.getElementById('playerSelect');
        const reasonSelect = document.getElementById('reasonSelect');
        if (playerSelect) playerSelect.innerHTML = '';
        if (reasonSelect) reasonSelect.innerHTML = '';
    }
    
    // UI Rendering Functions
    function populatePlayerSelect(players) {
        debug('Populating player select dropdown with ' + players.length + ' players');
        const playerSelect = $('#playerSelect');
        
        // Clear any existing options
        playerSelect.empty();
        
        // Add default empty option
        playerSelect.append($('<option>').val('').text(''));
        
        // Add all players
        players.forEach(player => {
            playerSelect.append($('<option>').val(player.id).text(player.name));
        });
        
        // Initialize Select2 with improved mobile settings
        playerSelect.select2({
            placeholder: "Selecteer speler(s)",
            width: '100%',
            allowClear: true,
            multiple: true,
            dropdownParent: $('#addFineForm'), // Attach to form for better mobile positioning
            tags: false, // Disable creating new tags
            tokenSeparators: [], // Disable automatic tokenization
            language: {
                noResults: function() { return "Geen spelers gevonden"; },
                searching: function() { return "Zoeken..."; }
            }
        }).on('select2:opening', function() {
            // Clear search input when dropdown opens
            setTimeout(() => {
                $('.select2-search__field').val('');
            }, 0);
        }).on('select2:close', function() {
            // Clear search input when dropdown closes
            setTimeout(() => {
                $('.select2-search__field').val('');
            }, 0);
        });
        
        // Increase the height and font size of the search field for mobile
        $('body').append(`
            <style>
                @media (max-width: 767px) {
                    .select2-search__field {
                        font-size: 16px !important; /* Prevents iOS zoom on focus */
                        padding: 12px 8px !important;
                        height: auto !important;
                    }
                    .select2-container--open .select2-dropdown {
                        min-width: 280px !important;
                    }
                    .select2-results__option {
                        padding: 12px 8px !important;
                        min-height: 48px;
                    }
                }
            </style>
        `);
    }
    
    function populateReasonSelect(reasons) {
        const select = document.getElementById('reasonSelect');
        if (!select) return;
        
        select.innerHTML = '';
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Selecteer een reden';
        select.appendChild(emptyOption);
        
        // Add reason options
        reasons.forEach(reason => {
            const option = document.createElement('option');
            option.value = reason.id;
            option.textContent = reason.description;
            select.appendChild(option);
        });
        
        // Initialize Select2
        try {
            $(select).select2({
                placeholder: "Selecteer een reden",
                allowClear: true,
                width: '100%'
            });
        } catch (error) {
            debug(`Error initializing Select2: ${error.message}`);
        }
    }
    
    // Add updateSelect2Styling function
    function updateSelect2Styling() {
        // Force Select2 to adopt proper styling
        try {
            $('.select2-container--default .select2-selection--single').css({
                'background-color': 'var(--input-bg)',
                'border-color': 'var(--input-border)',
                'color': 'var(--input-text)'
            });
            
            $('.select2-container--default .select2-selection--multiple').css({
                'background-color': 'var(--input-bg)',
                'border-color': 'var(--input-border)'
            });
        } catch (e) {
            debug(`Failed to update Select2 styling: ${e.message}`);
        }
    }
    
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
        
        fines.slice(0, 10).forEach(fine => createFineCard(container, fine));
    }
    
    function createFineCard(container, fine) {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200';
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold">${fine.playerName || 'Onbekende speler'}</h3>
                    <p class="text-gray-600">${fine.reasonDescription}</p>
                    <p class="text-gray-500 text-sm mt-1">${formatDate(fine.date)}</p>
                </div>
                <div class="flex items-center">
                    <span class="font-bold text-lg mr-4">€${formatCurrency(fine.amount)}</span>
                    <button data-fine-id="${fine.id}" class="delete-fine-btn text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener for delete button
        const deleteBtn = card.querySelector('.delete-fine-btn');
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
                await deleteFine(fine.id);
            }
        });
        
        container.appendChild(card);
    }
    
    function renderPlayersList(players) {
        const container = document.getElementById('playersList');
        if (!container) return;
        
        if (!players || players.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen spelers gevonden</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `<h2 class="text-xl font-semibold mb-4">Spelers (${players.length})</h2>`;
        
        players.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
            const item = document.createElement('div');
            item.className = 'bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 flex justify-between items-center';
            
            item.innerHTML = `
                <span>${player.name}</span>
                <button class="delete-player-btn text-red-500 hover:text-red-700" data-player-id="${player.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            container.appendChild(item);
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
        
        if (!reasons || reasons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen redenen gevonden</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `<h2 class="text-xl font-semibold mb-4">Redenen (${reasons.length})</h2>`;
        
        reasons.sort((a, b) => a.description.localeCompare(b.description)).forEach(reason => {
            const item = document.createElement('div');
            item.className = 'bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 flex justify-between items-center';
            
            item.innerHTML = `
                <span>${reason.description}</span>
                <button class="delete-reason-btn text-red-500 hover:text-red-700" data-reason-id="${reason.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            container.appendChild(item);
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
    async function addFine(player_id, reason_id) {
        try {
            if (!player_id) {
                showToast('Ongeldige speler selectie', 'error');
                return false;
            }
            
            if (!reason_id) {
                showToast('Ongeldige reden selectie', 'error');
                return false;
            }
            
            showLoading(true);
            debug(`Adding fine: player ${player_id}, reason ${reason_id}`);
            
            const fine = await apiRequest('/fines', {
                method: 'POST',
                body: JSON.stringify({
                    player_id: player_id,
                    reason_id: reason_id,
                    created_at: new Date().toISOString()
                })
            });
            
            if (fine) {
                showToast('Boete succesvol toegevoegd!', 'success');
                
                // Reload data
                await Promise.all([
                    loadRecentFines(),
                    loadTotalAmount()
                ]);
                
                return true;
            } else {
                throw new Error('Geen antwoord van server');
            }
        } catch (error) {
            debug(`Failed to add fine: ${error.message}`);
            showToast(`Fout bij toevoegen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteFine(id) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/fines?id=eq.${id}`;
            
            debug(`Making DELETE request to ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Boete succesvol verwijderd!', 'success');
            await loadFines(); // Reload fines
            return true;
        } catch (error) {
            debug(`Failed to delete fine: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    // Add a new player
    async function addPlayer(name, showToasts = true) {
        try {
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                if (showToasts) showToast('Ongeldige spelernaam', 'error');
                return false;
            }
            
            showLoading(true);
            debug(`Adding player: ${name}`);
            
            const player = await apiRequest('/players', {
                method: 'POST',
                body: JSON.stringify({ name: name.trim() })
            });
            
            if (player) {
                if (showToasts) showToast(`Speler "${name}" toegevoegd`, 'success');
                
                // Update player select elements
                await loadPlayers();
                
                return true;
            } else {
                throw new Error('Geen antwoord van server');
            }
        } catch (error) {
            debug(`Failed to add player: ${error.message}`);
            if (showToasts) showToast(`Fout bij toevoegen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deletePlayer(id) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/players?id=eq.${id}`;
            
            debug(`Making DELETE request to ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Speler succesvol verwijderd!', 'success');
            await Promise.all([loadPlayers(), loadFines()]); // Reload players and fines
            return true;
        } catch (error) {
            debug(`Failed to delete player: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    // Add a new reason
    async function addReason(description, amount, showToasts = true) {
        try {
            if (!description || typeof description !== 'string' || description.trim().length === 0) {
                if (showToasts) showToast('Ongeldige beschrijving', 'error');
                return false;
            }
            
            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                if (showToasts) showToast('Ongeldig bedrag', 'error');
                return false;
            }
            
            showLoading(true);
            debug(`Adding reason: ${description}, amount: ${amount}`);
            
            const reason = await apiRequest('/reasons', {
                method: 'POST',
                body: JSON.stringify({ 
                    description: description.trim(),
                    amount: parseFloat(amount)
                })
            });
            
            if (reason) {
                if (showToasts) showToast(`Reden "${description}" toegevoegd`, 'success');
                
                // Update reason select elements
                await loadReasons();
                
                return true;
            } else {
                throw new Error('Geen antwoord van server');
            }
        } catch (error) {
            debug(`Failed to add reason: ${error.message}`);
            if (showToasts) showToast(`Fout bij toevoegen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteReason(id) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/reasons?id=eq.${id}`;
            
            debug(`Making DELETE request to ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Reden succesvol verwijderd!', 'success');
            await loadReasons(); // Reload reasons
            return true;
        } catch (error) {
            debug(`Failed to delete reason: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    // Reset all data
    async function resetAllData() {
        try {
            // Show confirmation modal
            const confirmModal = document.getElementById('confirmModal');
            const confirmTitle = document.getElementById('confirmTitle');
            const confirmMessage = document.getElementById('confirmMessage');
            const confirmButton = document.getElementById('confirmButton');
            const cancelButton = document.getElementById('cancelButton');

            confirmTitle.textContent = 'Alles Resetten';
            confirmMessage.textContent = 'WAARSCHUWING: Dit zal ALLE boetes, spelers en redenen verwijderen. Deze actie kan niet ongedaan worden gemaakt!';
            
            // Show the modal
            confirmModal.classList.remove('hidden');
            confirmModal.classList.add('flex');
            
            // Return a new promise that will be resolved when the user confirms or cancels
            return new Promise((resolve) => {
                // Handle cancel
                cancelButton.onclick = function() {
                    confirmModal.classList.remove('flex');
                    confirmModal.classList.add('hidden');
                    resolve(false);
                };
                
                // Handle confirm
                confirmButton.onclick = async function() {
                    confirmModal.classList.remove('flex');
                    confirmModal.classList.add('hidden');
                    
                    // Show loading spinner
                    showLoading(true);
                    debug('Resetting all data...');
                    
                    try {
                        // First delete all fines (due to foreign key constraints)
                        await apiRequest('/fines', {
                            method: 'DELETE'
                        });
                        debug('All fines deleted');
                        
                        // Then delete all players
                        await apiRequest('/players', {
                            method: 'DELETE'
                        });
                        debug('All players deleted');
                        
                        // Finally delete all reasons
                        await apiRequest('/reasons', {
                            method: 'DELETE'
                        });
                        debug('All reasons deleted');
                        
                        // Clear local storage
                        localStorage.removeItem('players');
                        localStorage.removeItem('reasons');
                        localStorage.removeItem('fines');
                        debug('Local storage cleared');
                        
                        // Reset UI elements - updated for new structure
                        document.getElementById('totalAmount').textContent = '€0,00';
                        
                        // Reset the fines list
                        const recentFines = document.getElementById('recentFines');
                        recentFines.innerHTML = '';
                        const noRecentFines = document.getElementById('noRecentFines');
                        if (noRecentFines) {
                            noRecentFines.classList.remove('hidden');
                        }
                        
                        // Reset players list
                        const playersList = document.getElementById('playersList');
                        if (playersList) {
                            playersList.innerHTML = '<div class="text-gray-400 text-center py-4">Geen spelers gevonden</div>';
                        }
                        
                        // Reset reasons list
                        const reasonsList = document.getElementById('reasonsList');
                        if (reasonsList) {
                            reasonsList.innerHTML = '<div class="text-gray-400 text-center py-4">Geen redenen gevonden</div>';
                        }
                        
                        // Reset player and reason selects
                        const playerSelect = document.getElementById('playerSelect');
                        if (playerSelect) {
                            playerSelect.innerHTML = '<option value="">-- Selecteer speler --</option>';
                        }
                        
                        const reasonSelect = document.getElementById('reasonSelect');
                        if (reasonSelect) {
                            reasonSelect.innerHTML = '<option value="">-- Selecteer reden --</option>';
                        }
                        
                        // Show success message
                        showToast('Alle data is succesvol gereset', 'success');
                        debug('All data reset complete');
                        
                        resolve(true);
                    } catch (error) {
                        console.error('Error resetting data:', error);
                        showToast('Fout bij resetten van data: ' + error.message, 'error');
                        debug('Reset data error: ' + error.message);
                        resolve(false);
                    } finally {
                        showLoading(false);
                    }
                };
            });
        } catch (error) {
            console.error('Error in reset confirmation:', error);
            showToast('Fout bij weergeven van bevestiging: ' + error.message, 'error');
            return false;
        }
    }
    
    // Load recent fines and update the UI
    async function loadRecentFines() {
        try {
            debug('Loading recent fines...');
            const fines = await apiRequest('/fines?select=id,created_at,player_id,reason_id,players(name),reasons(description,amount)&order=created_at.desc&limit=10');
            
            if (!fines || !Array.isArray(fines)) {
                throw new Error('Invalid response from API');
            }
            
            // Update fines list
            const recentFines = document.getElementById('recentFines');
            const noRecentFines = document.getElementById('noRecentFines');
            
            if (recentFines) {
                recentFines.innerHTML = '';
                
                if (fines.length === 0) {
                    if (noRecentFines) noRecentFines.classList.remove('hidden');
                    return;
                }
                
                if (noRecentFines) noRecentFines.classList.add('hidden');
                
                fines.forEach(fine => {
                    const fineItem = document.createElement('div');
                    fineItem.className = 'fine-card p-4 border border-gray-200 rounded-lg shadow-sm relative';
                    fineItem.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div class="flex-1">
                                <div class="flex items-center mb-1">
                                    <span class="font-semibold text-blue-800">${fine.players?.name || 'Onbekend'}</span>
                                    <span class="text-gray-400 mx-2">•</span>
                                    <span class="text-gray-500 text-sm">${formatDate(fine.created_at)}</span>
                                </div>
                                <div class="text-gray-700">${fine.reasons?.description || 'Onbekende reden'}</div>
                            </div>
                            <div class="font-bold text-blue-700 text-lg">${formatCurrency(fine.reasons?.amount || 0)}</div>
                        </div>
                        <button class="delete-button absolute top-2 right-2 text-gray-400 hover:text-red-500" data-id="${fine.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    // Add event listener to delete button
                    const deleteButton = fineItem.querySelector('.delete-button');
                    deleteButton.addEventListener('click', async function() {
                        const fineId = this.getAttribute('data-id');
                        
                        // Show confirmation modal
                        const confirmModal = document.getElementById('confirmModal');
                        const confirmTitle = document.getElementById('confirmTitle');
                        const confirmMessage = document.getElementById('confirmMessage');
                        const confirmButton = document.getElementById('confirmButton');
                        const cancelButton = document.getElementById('cancelButton');

                        confirmTitle.textContent = 'Boete Verwijderen';
                        confirmMessage.textContent = 'Weet je zeker dat je deze boete wilt verwijderen?';
                        
                        // Show the modal
                        confirmModal.classList.remove('hidden');
                        confirmModal.classList.add('flex');
                        
                        // Handle cancel
                        cancelButton.onclick = function() {
                            confirmModal.classList.remove('flex');
                            confirmModal.classList.add('hidden');
                        };
                        
                        // Handle confirm
                        confirmButton.onclick = async function() {
                            confirmModal.classList.remove('flex');
                            confirmModal.classList.add('hidden');
                            
                            const success = await deleteFine(fineId);
                            if (success) {
                                await Promise.all([
                                    loadRecentFines(),
                                    loadTotalAmount()
                                ]);
                            }
                        };
                    });
                    
                    recentFines.appendChild(fineItem);
                });
            }
            
            debug(`Loaded ${fines.length} recent fines`);
        } catch (error) {
            debug(`Error loading recent fines: ${error.message}`);
            showToast('Fout bij laden van recente boetes', 'error');
        }
    }
    
    // Load total amount
    async function loadTotalAmount() {
        try {
            debug('Loading total amount...');
            const fines = await apiRequest('/fines?select=reasons(amount)');
            
            if (!fines || !Array.isArray(fines)) {
                throw new Error('Invalid response from API');
            }
        
            // Calculate total
            let total = 0;
            fines.forEach(fine => {
                const amount = parseFloat(fine.reasons?.amount || 0);
                if (!isNaN(amount)) {
                    total += amount;
                }
            });
            
            // Update total element
            const totalAmountEl = document.getElementById('totalAmount');
            if (totalAmountEl) {
                totalAmountEl.textContent = formatCurrency(total);
            }
            
            debug(`Total amount: ${total}`);
        } catch (error) {
            debug(`Error loading total amount: ${error.message}`);
            showToast('Fout bij laden van totaalbedrag', 'error');
        }
    }
    
    // Event Listeners
    function setupEventListeners() {
        // Tab switching functionality
        const addFineTab = document.getElementById('addFineTab');
        const manageTab = document.getElementById('manageTab');
        const addFineContent = document.getElementById('addFineContent');
        const manageContent = document.getElementById('manageContent');
        
        if (addFineTab && manageTab) {
            addFineTab.addEventListener('click', function() {
                // Activate this tab
                addFineTab.classList.add('active');
                manageTab.classList.remove('active');
                
                // Show/hide content
                addFineContent.classList.add('active');
                manageContent.classList.remove('active');
            });
            
            manageTab.addEventListener('click', function() {
                // Activate this tab
                manageTab.classList.add('active');
                addFineTab.classList.remove('active');
                
                // Show/hide content
                manageContent.classList.add('active');
                addFineContent.classList.remove('active');
            });
        }
        
        // Reset all data button
        const resetAllDataBtn = document.getElementById('resetAllDataBtn');
        if (resetAllDataBtn) {
            resetAllDataBtn.addEventListener('click', resetAllData);
        }
        
        // Add Fine Form
        const addFineForm = document.getElementById('addFineForm');
        if (addFineForm) {
            addFineForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const playerSelect = document.getElementById('playerSelect');
                const reasonSelect = document.getElementById('reasonSelect');
                
                if (!playerSelect || !reasonSelect) {
                    showToast('Formulier elementen niet gevonden', 'error');
                    return;
                }
                
                const playerId = playerSelect.value;
                const reasonId = reasonSelect.value;
                
                if (!playerId) {
                    showToast('Selecteer een speler', 'error');
                    return;
                }
                
                if (!reasonId) {
                    showToast('Selecteer een reden', 'error');
                    return;
                }
                
                const success = await addFine(playerId, reasonId);
                if (success) {
                    // Optionally reset the form
                    // addFineForm.reset();
                }
            });
        }
        
        // Add Player Form
        const addPlayerForm = document.getElementById('addPlayerForm');
        if (addPlayerForm) {
            addPlayerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const playerName = document.getElementById('playerName').value.trim();
                
                if (!playerName) {
                    showToast('Vul een naam in', 'error');
                    return;
                }
                
                const success = await addPlayer(playerName);
                if (success) {
                    addPlayerForm.reset();
                }
            });
        }
        
        // Bulk Add Players Button
        const addBulkPlayersBtn = document.getElementById('addBulkPlayersBtn');
        if (addBulkPlayersBtn) {
            addBulkPlayersBtn.addEventListener('click', async function() {
                const bulkPlayers = document.getElementById('bulkPlayers').value.trim();
                
                if (!bulkPlayers) {
                    showToast('Vul ten minste één speler in', 'error');
                    return;
                }
                
                // Split by commas or new lines
                const names = bulkPlayers.split(/[\n,]+/).map(name => name.trim()).filter(name => name);
                
                if (names.length === 0) {
                    showToast('Geen geldige namen gevonden', 'error');
                    return;
                }
                
                let addedCount = 0;
                showLoading(true);
                
                for (const name of names) {
                    if (name) {
                        const success = await addPlayer(name, false); // Don't show individual toasts
                        if (success) addedCount++;
                    }
                }
                
                document.getElementById('bulkPlayers').value = '';
                showLoading(false);
                showToast(`${addedCount} speler(s) toegevoegd`, addedCount > 0 ? 'success' : 'error');
                
                // Reload player list
                loadPlayers();
            });
        }
        
        // Add Reason Form
        const addReasonForm = document.getElementById('addReasonForm');
        if (addReasonForm) {
            addReasonForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const description = document.getElementById('reasonDescription').value.trim();
                const amount = document.getElementById('reasonAmount').value;
                
                if (!description) {
                    showToast('Vul een beschrijving in', 'error');
                    return;
                }
                
                if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                    showToast('Vul een geldig bedrag in', 'error');
                    return;
                }
                
                const success = await addReason(description, parseFloat(amount));
                if (success) {
                    addReasonForm.reset();
                }
            });
        }
        
        // Bulk Add Reasons Button
        const addBulkReasonsBtn = document.getElementById('addBulkReasonsBtn');
        if (addBulkReasonsBtn) {
            addBulkReasonsBtn.addEventListener('click', async function() {
                const bulkReasons = document.getElementById('bulkReasons').value.trim();
                
                if (!bulkReasons) {
                    showToast('Vul ten minste één reden in', 'error');
                    return;
                }
                
                // Split by new lines
                const lines = bulkReasons.split('\n').map(line => line.trim()).filter(line => line);
                
                if (lines.length === 0) {
                    showToast('Geen geldige redenen gevonden', 'error');
                    return;
                }
                
                let addedCount = 0;
                showLoading(true);
                
                for (const line of lines) {
                    // Parse "description, amount" format
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        const description = parts[0].trim();
                        // Extract amount - try to parse the last part as a number
                        const amountStr = parts[parts.length - 1].trim();
                        const amount = parseFloat(amountStr);
                        
                        if (description && !isNaN(amount) && amount > 0) {
                            const success = await addReason(description, amount, false); // Don't show individual toasts
                            if (success) addedCount++;
                        }
                    }
                }
                
                document.getElementById('bulkReasons').value = '';
                showLoading(false);
                showToast(`${addedCount} reden(en) toegevoegd`, addedCount > 0 ? 'success' : 'error');
                
                // Reload reason list
                loadReasons();
            });
        }
        
        // Reset Button
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', async function() {
                if (confirm('WAARSCHUWING: Dit zal ALLE data verwijderen! Weet je zeker dat je door wilt gaan?')) {
                    if (confirm('Dit is je laatste kans! Alle boetes, spelers en redenen worden verwijderd. Dit kan niet ongedaan worden gemaakt!')) {
                        await resetAllData();
                    }
                }
            });
        }
        
        // Manual Load Button
        const manualLoadButton = document.getElementById('manualLoadButton');
        if (manualLoadButton) {
            manualLoadButton.addEventListener('click', loadAllData);
        }
        
        // Clear Storage Button
        const clearStorageButton = document.getElementById('clearStorageButton');
        if (clearStorageButton) {
            clearStorageButton.addEventListener('click', function() {
                if (confirm('Weet je zeker dat je alle lokale opslag wilt wissen?')) {
                    localStorage.clear();
                    showToast('Lokale opslag gewist!', 'info');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }
            });
        }
    }
    
    // Add a function to force reload the page
    function forceReload() {
        // Clear any caches that might be preventing updates
        if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
                cacheNames.forEach(function(cacheName) {
                    caches.delete(cacheName);
                    debug(`Deleted cache: ${cacheName}`);
                });
                // Force a hard reload from the server
                window.location.reload(true);
            });
        } else {
            // Fallback for browsers without Cache API support
            window.location.reload(true);
        }
    }
    
    // Initialize the application
    async function init() {
        try {
            debug('Initializing admin panel...');
            showLoading(true);
            
            // Set up event listeners
            setupEventListeners();
            
            // Load all data in parallel
            await Promise.all([
                loadPlayers(),
                loadReasons(),
                loadRecentFines(),
                loadTotalAmount()
            ]);
            
            debug('Admin panel initialized successfully');
        } catch (error) {
            debug(`Error initializing admin panel: ${error.message}`);
            showToast('Fout bij initialiseren van admin panel', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Start the app
    init();
}); 