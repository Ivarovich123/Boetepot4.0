// Simplified admin panel without login
document.addEventListener('DOMContentLoaded', function() {
    // Global variables and config
    const SUPABASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc4ODM3ODksImV4cCI6MjAxMzQ1OTc4OX0.h3PwqEe-Tf_YSAK91J_I-0WXyP1MlRWvuKXp5WGxnZQ';
    
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
            showLoading(true);
            
            // Ensure endpoint starts with '/' if not already
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
            
            // Make sure query parameters are properly formatted
            let url = SUPABASE_URL + endpoint;
            
            // Apply cache busting
            url = addCacheBuster(url);
            
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
                    response = await fetch(url, requestOptions);
                    break; // If successful, exit the retry loop
                } catch (fetchError) {
                    retries--;
                    if (retries === 0) throw fetchError;
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
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
                errorMessage += 'Controleer uw internetverbinding of Supabase server kan niet worden bereikt. Mogelijk is er een CORS probleem.';
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
        
        // Add players
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
            language: {
                noResults: function() { return "Geen spelers gevonden"; },
                searching: function() { return "Zoeken..."; },
                inputTooShort: function() { return "Begin met typen..."; }
            },
            minimumInputLength: 0,
            templateResult: function(player) {
                if (!player.id) return player.text;
                return $(`<div class="select2-result">
                    <div class="font-medium">${player.text}</div>
                </div>`);
            },
            templateSelection: function(player) {
                if (!player.id) return player.text;
                return player.text;
            }
        });
        
        // Mobile optimization
        $('body').append(`
            <style>
                @media (max-width: 767px) {
                    .select2-container--open .select2-dropdown {
                        width: 100% !important;
                        max-width: none !important;
                    }
                    .select2-container .select2-selection--multiple {
                        min-height: 42px;
                    }
                    .select2-container--default .select2-selection--multiple .select2-selection__choice {
                        margin-top: 5px;
                        margin-bottom: 5px;
                    }
                    .select2-search__field {
                        font-size: 16px !important; /* Prevents iOS zoom on focus */
                    }
                    .select2-results__option {
                        padding: 10px 8px !important;
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
            option.textContent = `${reason.description} (${formatCurrency(reason.amount)})`;
            option.setAttribute('data-amount', reason.amount);
            select.appendChild(option);
        });
        
        // Initialize Select2
        try {
            $(select).select2({
                placeholder: "Selecteer een reden",
                allowClear: true,
                width: '100%',
                dropdownParent: $('#addFineForm'),
                language: {
                    noResults: function() { return "Geen redenen gevonden"; }
                }
            }).on('change', function() {
                // When reason changes, update the custom amount placeholder with the default amount
                const reasonId = $(this).val();
                const customAmountInput = document.getElementById('customAmount');
                
                if (reasonId && customAmountInput) {
                    const selectedOption = select.querySelector(`option[value="${reasonId}"]`);
                    if (selectedOption) {
                        const defaultAmount = selectedOption.getAttribute('data-amount');
                        customAmountInput.placeholder = `Standaard: ${formatCurrency(defaultAmount)}`;
                    }
                }
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
    async function addFine(playerIds, reasonId, customAmount = null) {
        try {
            if (!playerIds || playerIds.length === 0) {
                showToast('Selecteer minimaal één speler', 'error');
                return false;
            }
            
            if (!reasonId) {
                showToast('Selecteer een reden', 'error');
                return false;
            }
            
            showLoading(true);
            debug(`Adding fine for ${playerIds.length} players, reason ${reasonId}, custom amount: ${customAmount}`);
            
            // Get the reason details to use the default amount if no custom amount is provided
            let reasonAmount = 0;
            if (!customAmount) {
                try {
                    const reasonDetails = await apiRequest(`/reasons?id=eq.${reasonId}&select=amount`, { method: 'GET' });
                    if (reasonDetails && reasonDetails.length > 0) {
                        reasonAmount = reasonDetails[0].amount;
                    } else {
                        throw new Error('Reden niet gevonden');
                    }
                } catch (error) {
                    console.error('Error fetching reason amount:', error);
                    showToast('Fout bij ophalen van reden bedrag', 'error');
                    return false;
                }
            }
            
            // Use custom amount if provided, otherwise use the reason amount
            const amount = customAmount || reasonAmount;
            
            // Add a fine for each selected player
            const addedFines = [];
            for (const playerId of playerIds) {
                try {
                    const fine = await apiRequest('/fines', {
                        method: 'POST',
                        body: JSON.stringify({
                            player_id: playerId,
                            reason_id: reasonId,
                            amount: amount,
                            created_at: new Date().toISOString()
                        })
                    });
                    
                    if (fine) {
                        addedFines.push(fine);
                    }
                } catch (error) {
                    console.error(`Error adding fine for player ${playerId}:`, error);
                    // Continue with other players even if one fails
                }
            }
            
            if (addedFines.length > 0) {
                const playerCount = addedFines.length;
                showToast(`${playerCount} boete${playerCount !== 1 ? 's' : ''} succesvol toegevoegd!`, 'success');
                
                // Reset select2 and custom amount
                $('#playerSelect').val(null).trigger('change');
                $('#customAmount').val('');
                
                // Reload fines list
                await loadFines();
                
                return true;
            } else {
                throw new Error('Geen boetes toegevoegd');
            }
        } catch (error) {
            console.error('Failed to add fines:', error);
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
            const apiUrl = `${SUPABASE_URL}/fines?id=eq.${id}`;
            
            debug(`Making DELETE request to ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
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
            const apiUrl = `${SUPABASE_URL}/players?id=eq.${id}`