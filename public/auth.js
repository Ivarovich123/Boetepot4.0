// Authentication utilities
const AUTH = {
    TOKEN_KEY: 'authToken',
    EXPIRES_KEY: 'authExpires',
    THEME_KEY: 'theme',
    
    // Set authentication
    setAuth(password) {
        if (password !== 'Mandje123') {
            return false;
        }
        
        try {
            // Clear any existing tokens
            this.clearAuth();
            
            // Set new tokens
            const token = btoa(`admin:${Date.now()}`);
            const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
            
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.EXPIRES_KEY, expires.toString());
            
            return true;
        } catch (error) {
            console.error('Auth error:', error);
            return false;
        }
    },
    
    // Check if authenticated
    isAuthenticated() {
        try {
            const token = localStorage.getItem(this.TOKEN_KEY);
            const expires = localStorage.getItem(this.EXPIRES_KEY);
            
            if (!token || !expires) {
                return false;
            }
            
            const expiryTime = parseInt(expires);
            if (isNaN(expiryTime) || expiryTime <= Date.now()) {
                this.clearAuth();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },
    
    // Clear authentication
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.EXPIRES_KEY);
    },
    
    // Theme handling
    isDarkMode() {
        return localStorage.getItem(this.THEME_KEY) === 'dark' || 
               (!localStorage.getItem(this.THEME_KEY) && 
                window.matchMedia('(prefers-color-scheme: dark)').matches);
    },
    
    setTheme(isDark) {
        localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
        this.applyTheme();
    },
    
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        this.setTheme(!isDark);
    },
    
    applyTheme() {
        const isDark = this.isDarkMode();
        document.documentElement.classList.toggle('dark', isDark);
        
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = `fas fa-${isDark ? 'sun' : 'moon'} text-xl`;
        }
    }
};

// Simple authentication system
const Auth = {
    TOKEN_KEY: 'authToken',
    EXPIRES_KEY: 'authExpires',
    THEME_KEY: 'theme',
    PASSWORD: 'Mandje123',
    
    login(password) {
        console.log('Attempting login with password');
        
        if (password !== this.PASSWORD) {
            console.log('Invalid password');
            return false;
        }
        
        try {
            // Clear existing tokens first to prevent conflicts
            this.logout(false);
            
            // Set new tokens
            const token = btoa(`admin:${Date.now()}`);
            const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
            
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.EXPIRES_KEY, expires.toString());
            
            console.log('Login successful');
            return true;
        } catch (error) {
            console.error('Auth error:', error);
            return false;
        }
    },
    
    check() {
        try {
            console.log('Checking authentication...');
            const token = localStorage.getItem(this.TOKEN_KEY);
            const expires = localStorage.getItem(this.EXPIRES_KEY);
            
            if (!token || !expires) {
                console.log('No token or expiration found');
                return false;
            }
            
            const expiryTime = parseInt(expires);
            if (isNaN(expiryTime) || expiryTime <= Date.now()) {
                console.log('Token expired');
                this.logout(false);
                return false;
            }
            
            console.log('Valid authentication found');
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },
    
    logout(redirect = true) {
        console.log('Logging out user');
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.EXPIRES_KEY);
        
        if (redirect) {
            window.location.href = 'login.html';
        }
    },
    
    // Theme handling
    isDarkMode() {
        return localStorage.getItem(this.THEME_KEY) === 'dark' || 
               (!localStorage.getItem(this.THEME_KEY) && 
                window.matchMedia('(prefers-color-scheme: dark)').matches);
    },
    
    setTheme(isDark) {
        localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
        this.applyTheme();
    },
    
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        this.setTheme(!isDark);
    },
    
    applyTheme() {
        const isDark = this.isDarkMode();
        
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = `fas fa-${isDark ? 'sun' : 'moon'} text-xl`;
        }
    }
}; 