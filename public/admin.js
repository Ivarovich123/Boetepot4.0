let adminToken = localStorage.getItem('adminToken');

// Check if already logged in
if (adminToken) {
    showAdminPanel();
}

// Login form handler
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            const data = await response.json();
            adminToken = data.token;
            localStorage.setItem('adminToken', adminToken);
            showAdminPanel();
        } else {
            alert('Ongeldig wachtwoord');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Er is een fout opgetreden bij het inloggen');
    }
});

function showAdminPanel() {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('adminPanel').classList.remove('d-none');
    loadAllData();
}

async function loadAllData() {
    await Promise.all([
        loadPlayers(),
        loadReasons(),
        loadFines()
    ]);
}

async function loadPlayers() {
    try {
        const response = await fetch('/api/admin/players', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const players = await response.json();
        
        // Update player select
        const playerSelect = document.getElementById('playerSelect');
        playerSelect.innerHTML = '<option value="">Selecteer speler</option>';
        players.forEach(player => {
            if (player.name !== 'Admin') {
                playerSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
            }
        });

        // Update players list
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        players.forEach(player => {
            if (player.name !== 'Admin') {
                playersList.innerHTML += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        ${player.name}
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Error loading players:', error);
    }
}

async function loadReasons() {
    try {
        const response = await fetch('/api/admin/reasons', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const reasons = await response.json();
        
        // Update reason select
        const reasonSelect = document.getElementById('reasonSelect');
        reasonSelect.innerHTML = '<option value="">Selecteer reden</option>';
        reasons.forEach(reason => {
            reasonSelect.innerHTML += `<option value="${reason.id}">${reason.description}</option>`;
        });

        // Update reasons list
        const reasonsList = document.getElementById('reasonsList');
        reasonsList.innerHTML = '';
        reasons.forEach(reason => {
            reasonsList.innerHTML += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    ${reason.description}
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading reasons:', error);
    }
}

async function loadFines() {
    try {
        const response = await fetch('/api/admin/fines', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const fines = await response.json();
        
        const finesList = document.getElementById('finesList');
        finesList.innerHTML = '';
        fines.forEach(fine => {
            const date = new Date(fine.date).toLocaleString('nl-NL');
            finesList.innerHTML += `
                <tr>
                    <td>${fine.player_name}</td>
                    <td>${fine.reason_description}</td>
                    <td>€${fine.amount.toFixed(2)}</td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteFine(${fine.id})">
                            Verwijderen
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading fines:', error);
    }
}

// Add fine form handler
document.getElementById('addFineForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerId = document.getElementById('playerSelect').value;
    const reasonId = document.getElementById('reasonSelect').value;
    const amount = document.getElementById('amount').value;

    try {
        const response = await fetch('/api/admin/fines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                player_id: parseInt(playerId),
                reason_id: parseInt(reasonId),
                amount: parseFloat(amount)
            })
        });

        if (response.ok) {
            document.getElementById('addFineForm').reset();
            loadFines();
        } else {
            alert('Er is een fout opgetreden bij het toevoegen van de boete');
        }
    } catch (error) {
        console.error('Error adding fine:', error);
        alert('Er is een fout opgetreden bij het toevoegen van de boete');
    }
});

// Add player form handler
document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newPlayer').value;

    try {
        const response = await fetch('/api/admin/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            document.getElementById('newPlayer').value = '';
            loadPlayers();
        } else {
            alert('Er is een fout opgetreden bij het toevoegen van de speler');
        }
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Er is een fout opgetreden bij het toevoegen van de speler');
    }
});

// Add reason form handler
document.getElementById('addReasonForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('newReason').value;

    try {
        const response = await fetch('/api/admin/reasons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ description })
        });

        if (response.ok) {
            document.getElementById('newReason').value = '';
            loadReasons();
        } else {
            alert('Er is een fout opgetreden bij het toevoegen van de reden');
        }
    } catch (error) {
        console.error('Error adding reason:', error);
        alert('Er is een fout opgetreden bij het toevoegen van de reden');
    }
});

// Delete fine function
async function deleteFine(id) {
    if (!confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/fines/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            loadFines();
        } else {
            alert('Er is een fout opgetreden bij het verwijderen van de boete');
        }
    } catch (error) {
        console.error('Error deleting fine:', error);
        alert('Er is een fout opgetreden bij het verwijderen van de boete');
    }
}

// Reset database handler
document.getElementById('resetButton').addEventListener('click', async () => {
    if (!confirm('Weet je zeker dat je alles wilt resetten? Dit kan niet ongedaan worden gemaakt!')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/reset', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            loadAllData();
            alert('Database succesvol gereset');
        } else {
            alert('Er is een fout opgetreden bij het resetten van de database');
        }
    } catch (error) {
        console.error('Error resetting database:', error);
        alert('Er is een fout opgetreden bij het resetten van de database');
    }
}); 