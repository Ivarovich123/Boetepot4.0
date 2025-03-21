// API Base URL
const API_BASE_URL = '/api';

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

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Show loading spinner
function showLoading() {
    $('#loadingSpinner').addClass('flex').removeClass('hidden');
}

// Hide loading spinner
function hideLoading() {
    $('#loadingSpinner').removeClass('flex').addClass('hidden');
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
function createFineCard(fine) {
    return `
        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
                <div class="font-semibold">${fine.player}</div>
                <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(fine.amount)}</div>
            </div>
            <div class="text-gray-600 dark:text-gray-400">${fine.reason}</div>
            <div class="text-sm text-gray-500 dark:text-gray-500">${formatDate(fine.date)}</div>
        </div>
    `;
}

// Initialize Select2
function initializeSelect2() {
    $('.select2-container').remove(); // Clean up any existing instances
    
    $('#playerSelect, #fineSelect').select2({
        theme: 'default',
        placeholder: 'Selecteer...',
        allowClear: true,
        width: '100%'
    });
}

// Update Select2 theme when dark mode changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            const isDark = document.documentElement.classList.contains('dark');
            $('.select2-container--default .select2-selection--single').css('background-color', isDark ? 'rgb(17, 24, 39)' : 'white');
            $('.select2-container--default .select2-selection--single').css('border-color', isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)');
            $('.select2-container--default .select2-selection--single .select2-selection__rendered').css('color', isDark ? 'white' : 'inherit');
        }
    });
});

observer.observe(document.documentElement, {
    attributes: true
});

// Load data
async function loadData() {
    try {
        showLoading();
        
        // Load players for select
        const playersResponse = await fetch('/api/players');
        const players = await playersResponse.json();
        
        $('#playerSelect').empty().append('<option value="">Selecteer een speler</option>');
        players.forEach(player => {
            $('#playerSelect').append(`<option value="${player}">${player}</option>`);
        });
        
        // Load recent fines
        const recentResponse = await fetch('/api/fines/recent');
        const recentFines = await recentResponse.json();
        
        // Update recent fines display
        $('#recentFines').html(
            recentFines.length ? 
            recentFines.map(fine => createFineCard(fine)).join('') :
            '<div class="text-center py-4 text-gray-500">Geen recente boetes</div>'
        );
        
        // Update fine select for deletion
        $('#fineSelect').empty().append('<option value="">Selecteer een boete</option>');
        recentFines.forEach(fine => {
            const label = `${fine.player} - ${fine.reason} - ${formatCurrency(fine.amount)} - ${formatDate(fine.date)}`;
            $('#fineSelect').append(`<option value="${fine.id}">${label}</option>`);
        });
        
        // Initialize Select2 after populating options
        initializeSelect2();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Er is een fout opgetreden bij het laden van de gegevens', 'error');
    } finally {
        hideLoading();
    }
}

// Add fine
$('#addFineForm').on('submit', async function(e) {
    e.preventDefault();
    
    const player = $('#playerSelect').val();
    const reason = $('#reason').val();
    const amount = parseFloat($('#amount').val());
    
    if (!player || !reason || isNaN(amount)) {
        showToast('Vul alle velden in', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch('/api/fines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player, reason, amount })
        });
        
        if (!response.ok) throw new Error('Failed to add fine');
        
        showToast('Boete succesvol toegevoegd');
        $('#addFineForm')[0].reset();
        $('#playerSelect').val('').trigger('change');
        loadData();
        
    } catch (error) {
        console.error('Error adding fine:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de boete', 'error');
    } finally {
        hideLoading();
    }
});

// Add player
$('#addPlayerForm').on('submit', async function(e) {
    e.preventDefault();
    
    const name = $('#playerName').val().trim();
    
    if (!name) {
        showToast('Vul een naam in', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        if (!response.ok) throw new Error('Failed to add player');
        
        showToast('Speler succesvol toegevoegd');
        $('#addPlayerForm')[0].reset();
        loadData();
        
    } catch (error) {
        console.error('Error adding player:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de speler', 'error');
    } finally {
        hideLoading();
    }
});

// Delete fine
$('#deleteFineForm').on('submit', async function(e) {
    e.preventDefault();
    
    const fineId = $('#fineSelect').val();
    
    if (!fineId) {
        showToast('Selecteer een boete', 'error');
        return;
    }
    
    if (!confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/fines/${fineId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete fine');
        
        showToast('Boete succesvol verwijderd');
        $('#fineSelect').val('').trigger('change');
        loadData();
        
    } catch (error) {
        console.error('Error deleting fine:', error);
        showToast('Er is een fout opgetreden bij het verwijderen van de boete', 'error');
    } finally {
        hideLoading();
    }
});

// Reset data
$('#resetButton').on('click', async function() {
    if (!confirm('Weet je heel zeker dat je alle gegevens wilt resetten? Dit kan niet ongedaan worden gemaakt!')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch('/api/reset', {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to reset data');
        
        showToast('Alle gegevens zijn succesvol gereset');
        loadData();
        
    } catch (error) {
        console.error('Error resetting data:', error);
        showToast('Er is een fout opgetreden bij het resetten van de gegevens', 'error');
    } finally {
        hideLoading();
    }
});

// Initial load
loadData(); 