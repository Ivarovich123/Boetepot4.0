// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const expires = localStorage.getItem('authExpires');
    
    // Check if we're coming from login page to avoid redirect loops
    const referrer = document.referrer;
    const isFromLogin = referrer && (referrer.includes('/login') || referrer.includes('/login.html'));
    
    if (!token || !expires || parseInt(expires) <= Date.now()) {
        console.log('[DEBUG] Authentication failed');
        
        // Don't redirect if we just came from login page (prevents redirect loops)
        if (!isFromLogin) {
            console.log('[DEBUG] Redirecting to login page');
            // Use absolute URL to avoid any path issues
            window.location.href = window.location.origin + '/login.html';
        } else {
            console.log('[DEBUG] Coming from login page, not redirecting to prevent loop');
            // Clear any auth data that might be invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('authExpires');
            // Show error message rather than redirecting
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                    <h1>Authentication Failed</h1>
                    <p>Please <a href="${window.location.origin}/login.html">login</a> again.</p>
                </div>
            `;
        }
        return false;
    }
    
    console.log('[DEBUG] Authentication successful');
    return true;
}

// API Base URL - make sure this matches your backend setup
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// Debug setting
const DEBUG = true;
function debug(message) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
    }
}

// Theme handling
function setTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    }
    
    // Update Select2 dropdowns
    updateSelect2Theme(isDark);
}

// Initialize theme
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
} else {
    setTheme(false);
}

$('#theme-toggle').click(() => {
    setTheme(!document.documentElement.classList.contains('dark'));
});

// Tab functionality
function switchTab(tabId) {
    console.log(`[DEBUG] Switching to tab: ${tabId}`);
    
    // Validate tab ID
    if (tabId !== 'boetes' && tabId !== 'beheer') {
        console.error(`[DEBUG] Invalid tab ID: ${tabId}, defaulting to 'boetes'`);
        tabId = 'boetes';
    }
    
    // Store active tab in localStorage
    localStorage.setItem('activeAdminTab', tabId);
    
    // Check current visibility before change
    console.log(`[DEBUG] Before tab switch: boetes=${$('#content-boetes').is(':visible')}, beheer=${$('#content-beheer').is(':visible')}`);
    
    // Set display directly with CSS instead of using addClass/removeClass for hidden
    if (tabId === 'boetes') {
        $('#content-boetes').css('display', 'block');
        $('#content-beheer').css('display', 'none');
    } else {
        $('#content-boetes').css('display', 'none');
        $('#content-beheer').css('display', 'block');
    }
    
    // Update tab styling
    $('#tab-boetes, #tab-beheer').removeClass('tab-active');
    $(`#tab-${tabId}`).addClass('tab-active');
    
    // Check visibility after change
    console.log(`[DEBUG] After tab switch: boetes=${$('#content-boetes').is(':visible')}, beheer=${$('#content-beheer').is(':visible')}`);
    console.log(`[DEBUG] Element CSS - boetes: ${$('#content-boetes').css('display')}, beheer: ${$('#content-beheer').css('display')}`);
    
    // Force DOM update
    setTimeout(() => {
        console.log(`[DEBUG] Forcing reflow...`);
        $('#content-boetes, #content-beheer').each(function() {
            // Force a reflow
            void this.offsetHeight;
        });
        
        // Re-initialize Select2 after tab switch
        console.log(`[DEBUG] Reinitializing Select2 after tab switch to ${tabId}`);
        initializeSelect2();
        
        // Refresh display of visible elements
        if (tabId === 'boetes') {
            console.log(`[DEBUG] Refreshing fine displays`);
            $('#playerSelect, #reasonSelect, #recentFines, #fineSelect').trigger('update');
        } else {
            console.log(`[DEBUG] Refreshing management displays`);
            $('#playerName, #reasonDescription').trigger('update');
        }
    }, 100);
}

// Format currency
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn('Invalid amount:', amount);
        return '€0,00';
    }
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Onbekend';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
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

// Show/hide loading spinner
function toggleLoading(show) {
    console.log(`[DEBUG] ${show ? 'Showing' : 'Hiding'} loading spinner`);
    if (show) {
        $('#loadingSpinner').removeClass('hidden').addClass('flex');
    } else {
        $('#loadingSpinner').removeClass('flex').addClass('hidden');
    }
    console.log(`[DEBUG] Loading spinner classes:`, $('#loadingSpinner').attr('class'));
}

// Show toast message
function showToast(message, type = 'success') {
    const toast = $(`
        <div class="flex items-center p-4 mb-4 rounded-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
    `).hide();
    
    $('#toastContainer').append(toast);
    toast.fadeIn();
    
    setTimeout(() => {
        toast.fadeOut(() => toast.remove());
    }, 3000);
}

// Create a card for a fine
function createFineCard(fine, canDelete = true) {
    if (!fine) {
        console.error('[DEBUG] createFineCard called with null or undefined fine');
        return '';
    }
    
    console.log('[DEBUG] Creating fine card for:', fine);
    
    try {
        const formattedAmount = formatCurrency(fine.amount);
        const playerName = fine.player_name || 'Onbekend';
        const reasonDesc = fine.reason_description || 'Onbekend';
        const formattedDate = formatDate(fine.date);
        
        console.log('[DEBUG] Fine card values:', {
            player: playerName,
            reason: reasonDesc,
            amount: formattedAmount,
            date: formattedDate
        });
        
        let deleteButton = '';
        if (canDelete) {
            deleteButton = `
                <button class="delete-fine-btn absolute top-2 right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors" 
                        data-id="${fine.id}" data-name="${playerName}" aria-label="Verwijder boete">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        
        return `
            <div class="fine-card bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 relative ${canDelete ? 'pr-12' : ''}">
                ${deleteButton}
                <div class="flex items-center justify-between">
                    <div class="font-semibold">${playerName}</div>
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formattedAmount}</div>
                </div>
                <div class="text-gray-600 dark:text-gray-400">${reasonDesc}</div>
                <div class="text-sm text-gray-500 dark:text-gray-500">${formattedDate}</div>
            </div>
        `;
    } catch (error) {
        console.error('[DEBUG] Error in createFineCard:', error, 'for fine:', fine);
        return `
            <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-red-600 dark:text-red-400">
                Er is een fout opgetreden bij het weergeven van deze boete
            </div>
        `;
    }
}

// Force Select2 visibility
function forceSelect2Visibility() {
    console.log('[DEBUG] Forcing Select2 visibility');
    
    // Force display style
    $('.select2-container').each(function() {
        const $this = $(this);
        const display = $this.css('display');
        
        if (display === 'none') {
            console.warn('[DEBUG] Found hidden Select2 container, forcing display');
            $this.css('display', 'block');
        }
        
        // Ensure proper z-index
        if (parseInt($this.css('z-index')) < 1000) {
            $this.css('z-index', '1000');
        }
        
        // Force proper positioning
        const position = $this.css('position');
        if (position !== 'absolute' && position !== 'relative') {
            $this.css('position', 'relative');
        }
    });
    
    // Force visibility of dropdowns when open
    $(document).on('select2:open', function() {
  setTimeout(() => {
            $('.select2-dropdown').css({
                'display': 'block',
                'z-index': '9999'
            });
        }, 10);
    });
}

// Initialize Select2
function initializeSelect2() {
    console.log('[DEBUG] Inside initializeSelect2 function');
    
    // Clean up existing instances
    console.log('[DEBUG] Removing existing Select2 containers...');
    $('.select2-container').remove();
    
    try {
        // Initialize player select
        console.log('[DEBUG] Initializing playerSelect...');
        $('#playerSelect').select2({
            theme: 'default',
            placeholder: 'Selecteer een speler',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#playerSelect').parent(),
            language: {
                searching: function() {
                    return "Zoeken...";
                },
                noResults: function() {
                    return "Geen resultaten gevonden";
                }
            },
            templateResult: formatPlayerOption,
            templateSelection: formatPlayerOption
        });
        console.log('[DEBUG] playerSelect initialized');
        
        // Initialize reason select
        console.log('[DEBUG] Initializing reasonSelect...');
        $('#reasonSelect').select2({
            theme: 'default',
            placeholder: 'Selecteer een reden',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#reasonSelect').parent(),
            language: {
                searching: function() {
                    return "Zoeken...";
                },
                noResults: function() {
                    return "Geen resultaten gevonden";
                }
            },
            templateResult: formatReasonOption,
            templateSelection: formatReasonOption,
            tags: true,
            createTag: function(params) {
                return {
                    id: params.term,
                    text: params.term,
                    newTag: true
                };
            }
        });
        console.log('[DEBUG] reasonSelect initialized');
        
        // Force display update
        setTimeout(() => {
            console.log('[DEBUG] Forcing display refresh...');
            $('.select2').css('width', '100%').trigger('change');
            
            // Force Select2 visibility
            forceSelect2Visibility();
        }, 50);
        
        console.log('[DEBUG] Select2 initialization successful');
  } catch (error) {
        console.error('[DEBUG] Error in initializeSelect2:', error);
    }
}

// Format Select2 options to look nicer
function formatPlayerOption(player) {
    if (!player.id) return player.text;
    return $(`<div class="flex items-center p-1">
        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center font-bold mr-2">
            ${player.text.charAt(0).toUpperCase()}
        </div>
        <span>${player.text}</span>
    </div>`);
}

function formatReasonOption(reason) {
    if (!reason.id) return reason.text;
    return $(`<div class="p-1">
        <span class="font-medium">${reason.text}</span>
    </div>`);
}

// Initialize Select2 for search
$(document).on('select2:open', function() {
    setTimeout(function() {
        $('.select2-search__field').attr('placeholder', 'Zoeken...');
        $('.select2-search__field:visible').focus();
    }, 100);
});

// Update Select2 theme
function updateSelect2Theme(isDark) {
    $('.select2-container--default .select2-selection--single').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)',
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--default .select2-selection--single .select2-selection__rendered').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--default .select2-dropdown').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)'
    });
    
    $('.select2-container--default .select2-results__option').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--default .select2-search__field').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'color': isDark ? 'white' : 'inherit'
    });
    
    // Ensure dropdowns appear above other elements
    $('.select2-dropdown').css('z-index', '9999');
    $('.select2-container').css('z-index', '1051');
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
    debug(`Fetching API: ${endpoint}`);
    toggleLoading(true);
    
    try {
        // Ensure endpoint starts with slash
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // Try different URL formats
        const urls = [
            `/api${path}`,
            `${window.location.origin}/api${path}`,
            `https://boetepot.cloud/api${path}`,
            `https://www.boetepot.cloud/api${path}`
        ];
        
        debug(`Trying URLs: ${urls.join(', ')}`);
        
        let lastError = null;
        
        // Try each URL until one works
        for (const url of urls) {
            try {
                debug(`Trying URL: ${url}`);
                
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
                        'Accept': 'application/json',
        ...options.headers
      }
    });
    
                if (!response.ok) {
                    debug(`URL ${url} failed with ${response.status}`);
                    lastError = new Error(`API Error: ${response.status} ${response.statusText}`);
                    continue;
                }
                
                // Check content type
    const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    debug(`Response from ${url} is not JSON: ${contentType}`);
    
                    // Try to get text content and see if it's actually JSON
      const text = await response.text();
                    try {
                        const jsonData = JSON.parse(text);
                        debug('Successfully parsed text response as JSON');
                        
                        // Add the data to localStorage for the main page to use
                        saveDataToLocalStorage(endpoint, jsonData);
                        
                        return jsonData;
                    } catch (parseError) {
                        debug(`Error parsing text as JSON: ${parseError.message}`);
                        lastError = new Error('Response is not JSON');
                        continue;
                    }
                }
                
                // Try to parse as JSON
                const data = await response.json();
                debug(`API response successful with ${typeof data} from ${url}`);
                
                // Add the data to localStorage for the main page to use
                saveDataToLocalStorage(endpoint, data);
                
    return data;
  } catch (error) {
                debug(`Error for ${url}: ${error.message}`);
                lastError = error;
            }
        }
        
        throw lastError || new Error('Failed to fetch data from all URLs');
    } catch (error) {
        debug(`API Error: ${error.message}`);
        showToast(`Er is een fout opgetreden bij het ophalen van gegevens: ${error.message}`, 'error');
        return null;
    } finally {
        toggleLoading(false);
    }
}

// Save data to localStorage based on endpoint
function saveDataToLocalStorage(endpoint, data) {
    try {
        debug(`Saving data from ${endpoint} to localStorage`);
        
        if (endpoint.includes('/players')) {
            localStorage.setItem('players', JSON.stringify(data));
            debug(`Saved ${data.length} players to localStorage`);
        } 
        else if (endpoint.includes('/reasons')) {
            localStorage.setItem('reasons', JSON.stringify(data));
            debug(`Saved ${data.length} reasons to localStorage`);
        } 
        else if (endpoint.includes('/fines')) {
            // For fines endpoint data, we want to keep what we have and add new fines
            const existingFinesStr = localStorage.getItem('fines') || '[]';
            let existingFines = [];
            
            try {
                existingFines = JSON.parse(existingFinesStr);
            } catch (e) {
                debug(`Error parsing existing fines: ${e.message}`);
                existingFines = [];
            }
            
            // If data is a single fine object (from a POST response)
            if (!Array.isArray(data) && data.id) {
                // Check if the fine already exists
                const exists = existingFines.some(fine => fine.id === data.id);
                if (!exists) {
                    existingFines.push(data);
                    debug(`Added new fine with ID ${data.id}`);
                }
            } 
            // If data is an array of fines (from a GET response)
            else if (Array.isArray(data)) {
                // Merge new fines with existing ones, avoiding duplicates
                const uniqueFines = [...existingFines];
                
                data.forEach(newFine => {
                    if (!uniqueFines.some(fine => fine.id === newFine.id)) {
                        uniqueFines.push(newFine);
                    }
                });
                
                existingFines = uniqueFines;
                debug(`Updated fines in localStorage. Total: ${existingFines.length}`);
            }
            
            localStorage.setItem('fines', JSON.stringify(existingFines));
        }
  } catch (error) {
        debug(`Error saving to localStorage: ${error.message}`);
    }
}

// Load all data from API
async function loadData() {
    try {
        debug('Start loading all data...');
        
        // Load players and reasons for dropdowns
        await loadPlayers();
        await loadReasons();
        
        // Set up select2 for both dropdowns
        initializeSelect2();
        
        // Load recent fines
        await loadRecentFines();
        
        debug('All data loaded successfully');
        $('#debugStatus').text('Data loaded successfully');
  } catch (error) {
        debug(`Error loading data: ${error.message}`);
        $('#debugStatus').text(`Error: ${error.message}`);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
    }
}

// Specific data loading functions
async function loadPlayers() {
    try {
        console.log('[DEBUG] Loading players');
        
        // Get players from localStorage
        const players = JSON.parse(localStorage.getItem('players') || '[]');
        
        // Update the player select
        const playerSelect = $('#playerSelect');
        playerSelect.empty();
        playerSelect.append('<option value="">Selecteer een speler</option>');
        
        // Also update the players list
        const playersList = $('#playersList');
        playersList.empty();
        
        if (players.length === 0) {
            playersList.html('<p class="text-gray-500 dark:text-gray-400 text-center py-4">Geen spelers gevonden</p>');
        } else {
            players.forEach(player => {
                // Add to select
                playerSelect.append(`<option value="${player.id}">${player.name}</option>`);
                
                // Add to list with delete button
                playersList.append(`
                    <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-2 group">
                        <span class="text-gray-800 dark:text-gray-200">${player.name}</span>
                        <button class="delete-player-btn text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" 
                                data-player-id="${player.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `);
            });
            
            // Add event listeners for delete buttons
            $('.delete-player-btn').on('click', function() {
                const playerId = $(this).data('player-id');
                handleDeletePlayer(playerId);
            });
        }
        
        // Reinitialize Select2
        initializeSelect2();
        
        console.log('[DEBUG] Players loaded successfully');
  } catch (error) {
        console.error('[DEBUG] Error loading players:', error);
        showToast('Fout bij het laden van spelers', 'error');
    }
}

async function loadReasons() {
    try {
        console.log('[DEBUG] Loading reasons');
        
        // Get reasons from localStorage
        const reasons = JSON.parse(localStorage.getItem('reasons') || '[]');
        
        // Update the reason select
        const reasonSelect = $('#reasonSelect');
        reasonSelect.empty();
        reasonSelect.append('<option value="">Selecteer een reden</option>');
        
        // Also update the reasons list
        const reasonsList = $('#reasonsList');
        reasonsList.empty();
        
        if (reasons.length === 0) {
            reasonsList.html('<p class="text-gray-500 dark:text-gray-400 text-center py-4">Geen redenen gevonden</p>');
        } else {
            reasons.forEach(reason => {
                // Add to select
                reasonSelect.append(`<option value="${reason.id}">${reason.description}</option>`);
                
                // Add to list with delete button
                reasonsList.append(`
                    <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-2 group">
                        <span class="text-gray-800 dark:text-gray-200">${reason.description}</span>
                        <button class="delete-reason-btn text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" 
                                data-reason-id="${reason.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
                `);
            });
            
            // Add event listeners for delete buttons
            $('.delete-reason-btn').on('click', function() {
                const reasonId = $(this).data('reason-id');
                handleDeleteReason(reasonId);
            });
        }
        
        // Reinitialize Select2
        initializeSelect2();
        
        console.log('[DEBUG] Reasons loaded successfully');
  } catch (error) {
        console.error('[DEBUG] Error loading reasons:', error);
        showToast('Fout bij het laden van redenen', 'error');
    }
}

async function loadRecentFines() {
    debug('Loading recent fines');
    try {
        const recentFines = await fetchAPI('/recent-fines');
        if (recentFines && Array.isArray(recentFines)) {
            debug(`Loaded ${recentFines.length} recent fines`);
            
            // Also fetch all fines (not just recent) for the main page to use
            try {
                await fetchAPI('/fines');
            } catch(e) {
                debug(`Note: Fetching all fines failed: ${e.message}`);
            }
            
            // Update UI with recent fines
            const $recentFines = $('#recentFines');
            if ($recentFines.length) {
                if (recentFines.length === 0) {
                    $recentFines.html('<div class="text-center py-4 text-gray-500 dark:text-gray-400">Geen recente boetes gevonden</div>');
                } else {
                    const finesHtml = recentFines.map(fine => createFineCard(fine)).join('');
                    $recentFines.html(finesHtml);
                    
                    // Add event listeners for delete buttons
                    $('.delete-fine-btn').off('click').on('click', function() {
                        const fineId = $(this).data('id');
                        const playerName = $(this).data('name');
                        
                        if (confirm(`Weet je zeker dat je de boete voor ${playerName} wilt verwijderen?`)) {
                            deleteFine(fineId);
                        }
                    });
                }
            }
            
            return recentFines;
        } else {
            debug('No recent fines returned or invalid format');
            // Update UI
            const $recentFines = $('#recentFines');
            if ($recentFines.length) {
                $recentFines.html('<div class="text-center py-4 text-gray-500 dark:text-gray-400">Geen recente boetes gevonden</div>');
            }
            return [];
        }
    } catch (error) {
        debug(`Error loading recent fines: ${error.message}`);
        // Update UI
        const $recentFines = $('#recentFines');
        if ($recentFines.length) {
            $recentFines.html('<div class="text-center py-4 text-red-500">Er is een fout opgetreden bij het laden van recente boetes</div>');
        }
        return [];
    }
}

// Form Handlers

// Handle Add Fine form submission
const handleAddFine = async (event) => {
    event.preventDefault();
    debug('Add fine form submitted');
    
    // Get values from the form
    const playerId = $('#playerSelect').val();
    const reasonId = $('#reasonSelect').val();
    const amount = parseFloat($('#amount').val());
    
    // Basic validation
    if (!playerId) {
        debug('Missing player selection');
        showToast('Selecteer een speler', 'error');
      return;
    }
    
    if (!reasonId) {
        debug('Missing reason selection');
        showToast('Selecteer een reden', 'error');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        debug(`Invalid amount: ${amount}`);
        showToast('Voer een geldig bedrag in', 'error');
        return;
    }
    
    debug(`Adding fine: player=${playerId}, reason=${reasonId}, amount=${amount}`);
    toggleLoading(true);
    
    try {
        const response = await fetchAPI('/fines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_id: parseInt(playerId),
                reason_id: parseInt(reasonId),
                amount: amount
            })
        });
        
        if (response) {
            debug('Fine added successfully');
            showToast('Boete succesvol toegevoegd', 'success');
            
            // Add the new fine to localStorage even if API failed
            const playersData = JSON.parse(localStorage.getItem('players') || '[]');
            const reasonsData = JSON.parse(localStorage.getItem('reasons') || '[]');
            const finesData = JSON.parse(localStorage.getItem('fines') || '[]');
            
            const player = playersData.find(p => p.id == playerId);
            const reason = reasonsData.find(r => r.id == reasonId);
            
            // Create a new fine object
            const newFine = {
                id: Date.now(), // Use timestamp as temporary ID
                player_id: parseInt(playerId),
                reason_id: parseInt(reasonId),
                amount: amount,
                timestamp: new Date().toISOString(),
                player_name: player?.name || 'Onbekend',
                reason_description: reason?.description || 'Onbekend'
            };
            
            // Add to fines in localStorage
            finesData.push(newFine);
            localStorage.setItem('fines', JSON.stringify(finesData));
            debug('Added fine to localStorage');
            
            resetForm();
            loadRecentFines();
        } else {
            debug('Failed to add fine - API returned no response');
            showToast('Fout bij toevoegen van boete', 'error');
        }
  } catch (error) {
        debug(`Error adding fine: ${error.message}`);
        showToast(`Fout bij toevoegen van boete: ${error.message}`, 'error');
    } finally {
        toggleLoading(false);
    }
};

// Handle Add Player form submission
const handleAddPlayer = async (event) => {
  event.preventDefault();
    debug('Add player form submitted');
  
    // Get values from the form
    const name = $('#playerName').val().trim();
  
    // Basic validation
  if (!name) {
        debug('Missing player name');
        showToast('Voer een naam in', 'error');
    return;
  }
  
    debug(`Adding player: ${name}`);
    toggleLoading(true);
    
    try {
        const response = await fetchAPI('/players', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
        if (response) {
            debug('Player added successfully');
            
            // Add to localStorage even if API fails
            const playersData = JSON.parse(localStorage.getItem('players') || '[]');
            
            // Use the response or create a new player object
            const newPlayer = response || {
                id: Date.now(), // Use timestamp as temporary ID
                name: name
            };
            
            // Check if player already exists in localStorage
            if (!playersData.some(player => player.id === newPlayer.id)) {
                playersData.push(newPlayer);
                localStorage.setItem('players', JSON.stringify(playersData));
                debug(`Added player ${name} to localStorage`);
            }
            
            showToast('Speler succesvol toegevoegd', 'success');
            $('#playerName').val('');
            loadPlayers();
        } else {
            debug('Failed to add player - API returned no response');
            showToast('Fout bij toevoegen van speler', 'error');
        }
  } catch (error) {
        debug(`Error adding player: ${error.message}`);
        showToast(`Fout bij toevoegen van speler: ${error.message}`, 'error');
  } finally {
    toggleLoading(false);
  }
};

// Handle Add Reason form submission
const handleAddReason = async (event) => {
  event.preventDefault();
    debug('Add reason form submitted');
  
    // Get values from the form
    const description = $('#reasonDescription').val().trim();
  
    // Basic validation
  if (!description) {
        debug('Missing reason description');
        showToast('Voer een beschrijving in', 'error');
    return;
  }
  
    debug(`Adding reason: ${description}`);
    toggleLoading(true);
    
    try {
        const response = await fetchAPI('/reasons', {
      method: 'POST',
      body: JSON.stringify({ description })
    });
    
        if (response) {
            debug('Reason added successfully');
            
            // Add to localStorage even if API fails
            const reasonsData = JSON.parse(localStorage.getItem('reasons') || '[]');
            
            // Use the response or create a new reason object
            const newReason = response || {
                id: Date.now(), // Use timestamp as temporary ID
                description: description
            };
            
            // Check if reason already exists in localStorage
            if (!reasonsData.some(reason => reason.id === newReason.id)) {
                reasonsData.push(newReason);
                localStorage.setItem('reasons', JSON.stringify(reasonsData));
                debug(`Added reason ${description} to localStorage`);
            }
            
            showToast('Reden succesvol toegevoegd', 'success');
            $('#reasonDescription').val('');
            loadReasons();
        } else {
            debug('Failed to add reason - API returned no response');
            showToast('Fout bij toevoegen van reden', 'error');
        }
  } catch (error) {
        debug(`Error adding reason: ${error.message}`);
        showToast(`Fout bij toevoegen van reden: ${error.message}`, 'error');
  } finally {
    toggleLoading(false);
  }
};

// Reset data
$('#resetButton').on('click', async function() {
    if (!confirm('WAARSCHUWING: Dit zal ALLE boetes verwijderen. Deze actie kan niet ongedaan worden gemaakt! Weet je zeker dat je wilt doorgaan?')) {
        return;
    }
    
    const confirmation = prompt('Typ "RESET" om te bevestigen:');
    if (confirmation !== 'RESET') {
        showToast('Reset geannuleerd', 'error');
    return;
  }
  
  try {
        await fetchAPI('/reset', {
            method: 'POST'
        });
        
        showToast('Alle gegevens zijn gereset');
        await loadData();
        
  } catch (error) {
        console.error('Error resetting data:', error);
    }
});

// Validate Select2 initialization
function validateSelect2() {
    console.log('[DEBUG] Validating Select2 setup...');
    
    // Check if Select2 containers exist
    const select2Count = $('.select2-container').length;
    console.log(`[DEBUG] Found ${select2Count} Select2 containers`);
    
    // Check each Select2 element
    ['#playerSelect', '#reasonSelect'].forEach(selector => {
        const $el = $(selector);
        const hasSelect2 = $el.hasClass('select2-hidden-accessible');
        
        console.log(`[DEBUG] ${selector}: exists=${$el.length > 0}, select2-initialized=${hasSelect2}`);
        
        if ($el.length > 0 && !hasSelect2) {
            console.warn(`[DEBUG] Re-initializing ${selector}`);
            try {
                $el.select2({
                    theme: 'default',
                    placeholder: $el.data('placeholder') || 'Selecteer een optie',
                    allowClear: true,
                    width: '100%',
                    dropdownParent: $el.parent()
                });
            } catch (err) {
                console.error(`[DEBUG] Error initializing ${selector}:`, err);
            }
        }
    });
    
    // Update Select2 theme
    const isDark = document.documentElement.classList.contains('dark');
    updateSelect2Theme(isDark);
}

// Debug functions
function enableDebugMode() {
    debug('Debug mode enabled');
    
    // Set debug flag
    window.DEBUG = true;
    
    // Create toggle function for the debug panel
    window.toggleDebugPanel = function() {
        const panel = $('#debugPanel');
        panel.toggleClass('hidden');
        debug('Debug panel toggled');
    };
    
    // Set up API health check
    window.checkApiHealth = async function() {
        debug('Running API health check');
        $('#debugStatus').text('Running API health check...');
        
        try {
            // Test endpoints
            const endpoints = ['/players', '/reasons', '/recent-fines'];
            const results = {};
            
            for (const endpoint of endpoints) {
                try {
                    debug(`Testing endpoint: ${endpoint}`);
                    const startTime = performance.now();
                    const response = await fetchAPI(endpoint);
                    const duration = Math.round(performance.now() - startTime);
                    results[endpoint] = { 
                        status: response ? 'OK' : 'ERROR', 
                        duration: `${duration}ms`,
                        data: response ? `Got ${Array.isArray(response) ? response.length : 'non-array'} items` : 'No data'
                    };
                } catch (err) {
                    results[endpoint] = { status: 'ERROR', error: err.message };
                }
            }
            
            // Format results
            const resultStr = Object.entries(results)
                .map(([endpoint, result]) => `${endpoint}: ${result.status} ${result.duration || ''} ${result.error || ''} ${result.data || ''}`)
                .join('\n');
            
            $('#debugStatus').html(`API Health Check Results:<br><pre>${resultStr}</pre>`);
            debug('Health check complete:', results);
        } catch (error) {
            debug(`Health check failed: ${error.message}`);
            $('#debugStatus').text(`Health check failed: ${error.message}`);
        }
    };
}

// Handle fine deletion directly from the card
async function handleFineDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const fineId = $(this).data('id');
    const playerName = $(this).data('name');
    
    if (!fineId) {
        showToast('Kan deze boete niet verwijderen: ongeldige ID', 'error');
        return;
    }
    
    if (!confirm(`Weet je zeker dat je de boete voor ${playerName} wilt verwijderen?`)) {
    return;
  }
  
  try {
        console.log(`[DEBUG] Deleting fine with ID: ${fineId}`);
        await fetchAPI(`/fines/${fineId}`, {
            method: 'DELETE'
        });
        
        showToast('Boete succesvol verwijderd');
        
        // Reload all data
        loadData();
        
    } catch (error) {
        console.error('[DEBUG] Error deleting fine:', error);
        showToast('Fout bij verwijderen van boete', 'error');
    }
}

// DOM checker and repair function
function checkAndRepairDOM() {
    debug('Running DOM check and repair');
    
    // List of required DOM elements
    const requiredElements = [
        '#tab-boetes', 
        '#tab-beheer', 
        '#content-boetes', 
        '#content-beheer',
        '#playerSelect',
        '#reasonSelect',
        '#recentFines'
    ];
    
    // Check if all required elements exist
    const missingElements = requiredElements.filter(selector => $(selector).length === 0);
    
    if (missingElements.length > 0) {
        debug(`Missing DOM elements: ${missingElements.join(', ')}`);
        return false;
    }
    
    debug('All required DOM elements found');
    
    // Set up tab functionality
    $('#tab-boetes').off('click').on('click', function() {
        debug('Switching to Boetes tab');
        $('#tab-boetes').addClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .removeClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#tab-beheer').removeClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .addClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#content-boetes').removeClass('hidden');
        $('#content-beheer').addClass('hidden');
        localStorage.setItem('activeTab', 'boetes');
    });
    
    $('#tab-beheer').off('click').on('click', function() {
        debug('Switching to Beheer tab');
        $('#tab-beheer').addClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .removeClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#tab-boetes').removeClass('text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500')
            .addClass('border-transparent hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-600 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400');
        $('#content-beheer').removeClass('hidden');
        $('#content-boetes').addClass('hidden');
        localStorage.setItem('activeTab', 'beheer');
    });
    
    // Check if all forms are properly initialized
    const forms = ['addFineForm', 'addPlayerForm', 'addReasonForm'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            debug(`Form ${formId} found`);
        } else {
            debug(`Form ${formId} not found in DOM`);
        }
    });
    
    // Set up delete buttons
    $('.delete-fine-btn').off('click').on('click', handleFineDelete);
    
    // Check Select2 elements
    validateSelect2();
    
    // Repair any broken CSS 
    $('.select2-container').css({
        'display': 'block',
        'position': 'relative',
        'z-index': '1050'
    });
    
    // Check if content is visible
    const boetesVisible = $('#content-boetes').is(':visible');
    const beheerVisible = $('#content-beheer').is(':visible');
    
    debug(`Content visibility: boetes=${boetesVisible}, beheer=${beheerVisible}`);
    
    // If no content is visible, force display of boetes tab
    if (!boetesVisible && !beheerVisible) {
        debug('No content visible, forcing display of boetes tab');
        $('#content-boetes').css('display', 'block');
        $('#content-beheer').css('display', 'none');
        $('#tab-boetes').addClass('tab-active');
        $('#tab-beheer').removeClass('tab-active');
    }
    
    // Apply theme
    applyTheme();
    
    $('#debugStatus').text('DOM check completed: ' + new Date().toLocaleTimeString());
    return true;
}

// Setup event handlers
function bindEvents() {
    $('#addPlayerForm').off('submit').on('submit', handleAddPlayer);
    $('#addReasonForm').off('submit').on('submit', handleAddReason);
    $('#addFineForm').off('submit').on('submit', handleAddFine);
    $('#resetButton').off('click').on('click', handleReset);
    $('#manualLoadButton').off('click').on('click', loadData);
    $('#checkApiButton').off('click').on('click', checkApiHealth);
    
    // Bind event for delete buttons using delegation
    $(document).off('click', '.delete-fine-btn').on('click', '.delete-fine-btn', function() {
        const fineId = $(this).data('id');
        const playerName = $(this).data('name');
        
        if (confirm(`Weet je zeker dat je de boete van ${playerName} wilt verwijderen?`)) {
            deleteFine(fineId);
        }
    });
    
    debug('All event handlers bound successfully');
}

// Initialize the admin page
function initialize() {
    try {
        console.log('[DEBUG] Initializing admin page...');
        
        // Check if we're on the admin page by looking for typical admin elements
        if (!document.querySelector('.container') || !document.getElementById('addFineForm')) {
            console.error('[DEBUG] Admin page elements not found');
            return;
        }
        
        // Add management sections
        addManagementSections();
        
        // Setup event listeners
        bindEvents();
        
        // Setup tabs
        setupTabs();
        
        // Load data
        loadPlayers();
        loadReasons();
        loadRecentFines();
        updateStats();
        
        // Setup theme
        setupTheme();
        
        console.log('[DEBUG] Admin page initialized successfully');
  } catch (error) {
        console.error('[DEBUG] Initialization error:', error);
    }
}

// Handle Reset - ensure it works with localStorage
function handleReset() {
    try {
        if (confirm('WAARSCHUWING: Dit zal ALLE data verwijderen. Deze actie kan niet ongedaan worden gemaakt. Weet je het zeker?')) {
            console.log('[DEBUG] Resetting all data...');
            
            // Clear all localStorage data
            localStorage.removeItem('players');
            localStorage.removeItem('reasons');
            localStorage.removeItem('fines');
            
            // For compatibility, also try to clear via API
            try {
                fetchAPI('/reset', { method: 'POST' })
                    .catch(error => {
                        console.log('[DEBUG] API reset failed, but localStorage was cleared:', error);
                    });
            } catch (error) {
                console.log('[DEBUG] API not available for reset, using localStorage only');
            }
            
            showToast('Alle data is succesvol verwijderd!', 'success');
            
            // Force update stats
            updateStats();
            
            // Reload data to refresh UI
            loadPlayers();
            loadReasons();
            loadRecentFines();
            
            $('#debugStatus').text('Data reset successful');
        }
    } catch (error) {
        console.error('[DEBUG] Error in reset:', error);
        showToast('Er is een fout opgetreden bij het resetten van de data', 'error');
        $('#debugStatus').text(`Reset failed: ${error.message}`);
    }
}

// Stats update function
function updateStats() {
    try {
        console.log('[DEBUG] Updating statistics...');
        
        // Get data from localStorage
        const players = JSON.parse(localStorage.getItem('players') || '[]');
        const fines = JSON.parse(localStorage.getItem('fines') || '[]');
        
        // Calculate total
        const totalAmount = fines.reduce((sum, fine) => sum + (parseFloat(fine.amount) || 0), 0);
        
        // Update UI stats
        $('#totalAmount').text(formatCurrency(totalAmount));
        $('#playerCount').text(players.length);
        $('#fineCount').text(fines.length);
        
        console.log('[DEBUG] Statistics updated successfully');
  } catch (error) {
        console.error('[DEBUG] Error updating statistics:', error);
    }
}

// Apply theme function
function applyTheme() {
    debug('Applying current theme');
    const isDarkMode = localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    }
    
    // Update Select2 theme
    updateSelect2Theme(isDarkMode);
}

// Toggle theme function
function toggleTheme() {
    debug('Toggling theme');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isDarkMode) {
        localStorage.theme = 'light';
        document.documentElement.classList.remove('dark');
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    } else {
        localStorage.theme = 'dark';
        document.documentElement.classList.add('dark');
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
    }
    
    // Update Select2 theme
    updateSelect2Theme(!isDarkMode);
}

// Reset form helper function
function resetForm() {
    debug('Resetting form fields');
    // Reset the add fine form
    $('#addFineForm')[0].reset();
    
    // Reset Select2 dropdowns
    $('#playerSelect').val(null).trigger('change');
    $('#reasonSelect').val(null).trigger('change');
    
    // Reset other inputs if needed
    $('#amount').val('');
}

// API Health Check function
async function checkApiHealth() {
    debug('Running API health check');
    $('#debugStatus').html('Running API health check...');
    
    const results = [];
    const endpoints = ['/players', '/reasons', '/recent-fines'];
    
    toggleLoading(true);
    
    try {
        // Test each endpoint sequentially
        for (const endpoint of endpoints) {
            try {
                debug(`Testing endpoint: ${endpoint}`);
                const startTime = performance.now();
                
                // Try to fetch from the endpoint
                const response = await fetchAPI(endpoint);
                const duration = Math.round(performance.now() - startTime);
                
                const status = response ? 'OK' : 'ERROR';
                const count = response && Array.isArray(response) ? response.length : 'N/A';
                
                results.push(`${endpoint}: ${status} (${duration}ms) - ${count} items`);
                debug(`Endpoint ${endpoint} test completed: ${status}`);
  } catch (error) {
                results.push(`${endpoint}: ERROR - ${error.message}`);
                debug(`Error testing endpoint ${endpoint}: ${error.message}`);
            }
        }
        
        // Update the debug status display
        $('#debugStatus').html(`
            <div class="font-semibold mb-2">API Health Check Results:</div>
            <div class="space-y-1">
                ${results.map(result => 
                    `<div class="text-sm ${result.includes('ERROR') ? 'text-red-500' : 'text-green-500'}">${result}</div>`
                ).join('')}
            </div>
            <div class="mt-2 text-xs text-gray-500">Completed at: ${new Date().toLocaleTimeString()}</div>
        `);
        
        debug('API health check completed');
    } catch (error) {
        $('#debugStatus').html(`
            <div class="text-red-500">Health check failed: ${error.message}</div>
        `);
        debug(`API health check failed: ${error.message}`);
  } finally {
    toggleLoading(false);
  }
}

// Handle delete player
function handleDeletePlayer(playerId) {
    if (!playerId) return;
    
    // Confirm deletion
    if (!confirm('Weet je zeker dat je deze speler wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        return;
    }
    
    try {
        // Get existing players
        const players = JSON.parse(localStorage.getItem('players') || '[]');
        const fines = JSON.parse(localStorage.getItem('fines') || '[]');
        
        // Filter out the player to delete
        const updatedPlayers = players.filter(player => player.id !== parseInt(playerId));
        
        // Remove any fines associated with this player
        const updatedFines = fines.filter(fine => {
            const finePlayerId = fine.player_id || fine.playerId;
            return finePlayerId !== parseInt(playerId);
        });
        
        // Save the updated data
        localStorage.setItem('players', JSON.stringify(updatedPlayers));
        localStorage.setItem('fines', JSON.stringify(updatedFines));
        
        // Refresh the UI
    loadPlayers();
        updateStats();
        
        showToast('Speler succesvol verwijderd!', 'success');
    } catch (error) {
        console.error('[DEBUG] Error deleting player:', error);
        showToast('Fout bij het verwijderen van de speler', 'error');
    }
}

// Handle delete reason
function handleDeleteReason(reasonId) {
    if (!reasonId) return;
    
    // Confirm deletion
    if (!confirm('Weet je zeker dat je deze reden wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        return;
    }
    
    try {
        // Get existing reasons
        const reasons = JSON.parse(localStorage.getItem('reasons') || '[]');
        const fines = JSON.parse(localStorage.getItem('fines') || '[]');
        
        // Filter out the reason to delete
        const updatedReasons = reasons.filter(reason => reason.id !== parseInt(reasonId));
        
        // Update fines with this reason (set reason to null)
        const updatedFines = fines.map(fine => {
            const fineReasonId = fine.reason_id || fine.reasonId;
            if (fineReasonId === parseInt(reasonId)) {
                return {
                    ...fine,
                    reason_id: null,
                    reasonId: null
                };
            }
            return fine;
        });
        
        // Save the updated data
        localStorage.setItem('reasons', JSON.stringify(updatedReasons));
        localStorage.setItem('fines', JSON.stringify(updatedFines));
        
        // Refresh the UI
    loadReasons();
        updateStats();
        
        showToast('Reden succesvol verwijderd!', 'success');
    } catch (error) {
        console.error('[DEBUG] Error deleting reason:', error);
        showToast('Fout bij het verwijderen van de reden', 'error');
    }
}

// Add UI sections for player and reason management
function addManagementSections() {
    // Add players and reasons management sections if they don't exist
    if ($('#playersList').length === 0) {
        $('#playersTab .tab-content').append(`
            <div class="mt-6">
                <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Spelers beheren</h3>
                <div id="playersList" class="space-y-2 max-h-60 overflow-y-auto p-2"></div>
            </div>
        `);
    }
    
    if ($('#reasonsList').length === 0) {
        $('#reasonsTab .tab-content').append(`
            <div class="mt-6">
                <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Redenen beheren</h3>
                <div id="reasonsList" class="space-y-2 max-h-60 overflow-y-auto p-2"></div>
            </div>
        `);
    }
}

// Setup tabs functionality
function setupTabs() {
    try {
        debug('Setting up tabs');
        
        // Tab switching functionality
        $('#tab-boetes').off('click').on('click', function() {
            debug('Boetes tab clicked');
            $('.nav-tab').removeClass('active-tab');
            $('.tab-content').addClass('hidden');
            
            $(this).addClass('active-tab');
            $('#finesTab').removeClass('hidden');
            
            localStorage.setItem('activeTab', 'boetes');
        });
        
        $('#tab-players').off('click').on('click', function() {
            debug('Players tab clicked');
            $('.nav-tab').removeClass('active-tab');
            $('.tab-content').addClass('hidden');
            
            $(this).addClass('active-tab');
            $('#playersTab').removeClass('hidden');
            
            localStorage.setItem('activeTab', 'players');
        });
        
        $('#tab-reasons').off('click').on('click', function() {
            debug('Reasons tab clicked');
            $('.nav-tab').removeClass('active-tab');
            $('.tab-content').addClass('hidden');
            
            $(this).addClass('active-tab');
            $('#reasonsTab').removeClass('hidden');
            
            localStorage.setItem('activeTab', 'reasons');
        });
        
        // Add nav-tab class to all tab elements and add active-tab to default tab
        $('#tab-boetes, #tab-players, #tab-reasons').addClass('nav-tab');
        $('#tab-boetes').addClass('active-tab');
        $('#finesTab').removeClass('hidden');
        
        debug('Tabs setup completed');
    } catch (error) {
        console.error('[DEBUG] Error setting up tabs:', error);
    }
}

// Setup theme functionality
function setupTheme() {
    try {
        console.log('[DEBUG] Setting up theme');
        
        // Set initial theme
        const isDarkMode = localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            $('#theme-toggle-icon').removeClass('fa-moon').addClass('fa-sun');
        } else {
            document.documentElement.classList.remove('dark');
            $('#theme-toggle-icon').removeClass('fa-sun').addClass('fa-moon');
        }
        
        // Theme toggle handler
        $('#theme-toggle').click(function() {
            const isDark = document.documentElement.classList.contains('dark');
            
            if (isDark) {
                document.documentElement.classList.remove('dark');
                localStorage.theme = 'light';
                $('#theme-toggle-icon').removeClass('fa-sun').addClass('fa-moon');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.theme = 'dark';
                $('#theme-toggle-icon').removeClass('fa-moon').addClass('fa-sun');
            }
            
            // Update Select2 theme
            updateSelect2Theme(!isDark);
        });
        
        console.log('[DEBUG] Theme setup completed');
  } catch (error) {
        console.error('[DEBUG] Error setting up theme:', error);
    }
}

// Document ready handler
$(document).ready(function() {
    console.log('[DEBUG] Document ready');
    
    // Check authentication before initializing the page
    setTimeout(() => {
        try {
            if (checkAuth()) {
                console.log('[DEBUG] Authentication successful, initializing page');
                initialize();
            } else {
                console.log('[DEBUG] Authentication failed, not initializing page');
            }
        } catch (error) {
            console.error('[DEBUG] Error during authentication check:', error);
        }
    }, 200); // Slight delay to ensure everything is loaded
}); 