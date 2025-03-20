# Boetepot Heren 8

A modern web application for managing fines for the Heren 8 sports team. Built with Node.js, Express, and PostgreSQL.

## Features

- Display total fines with animated counter
- View recent fines (last 10)
- Player history with individual fine records
- Leaderboard showing total fines per player
- Admin panel for managing fines
- Dark/light theme support
- Responsive design
- Real-time search functionality

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/boetepot-heren-8.git
cd boetepot-heren-8
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=postgres://localhost:5432/boetepot
PORT=3000
ADMIN_PASSWORD=your_secure_password
NODE_ENV=development
```

4. Create a PostgreSQL database:
```bash
createdb boetepot
```

5. Start the application:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## Deployment to Render

1. Create a new PostgreSQL database on Render:
   - Go to your Render dashboard
   - Click "New +" and select "PostgreSQL"
   - Choose a name for your database
   - Select the region closest to your users
   - Click "Create Database"

2. Create a new Web Service on Render:
   - Go to your Render dashboard
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Choose the following settings:
     - Name: boetepot-heren-8
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plan: Free

3. Set the following environment variables in your Web Service:
   - `DATABASE_URL`: Your PostgreSQL connection string (automatically set by Render)
   - `PORT`: 10000 (Render's default)
   - `ADMIN_PASSWORD`: Your secure admin password
   - `NODE_ENV`: production

4. Click "Create Web Service"

Your application will be automatically deployed and available at `https://boetepot-heren-8.onrender.com` (or your custom domain if configured).

## Database Backup

Render automatically handles database backups for PostgreSQL databases. You can find backup information in your Render dashboard under the PostgreSQL service.

## Usage

### Public Features
- View total fines on the homepage
- Browse recent fines
- Check player history using the dropdown
- View the leaderboard

### Admin Features
1. Click the login button
2. Enter the admin password
3. Access the admin panel to:
   - Add new fines
   - View all fines
   - Search through fines
   - Delete existing fines

## Security Notes

- Change the default admin password in the `.env` file
- Use HTTPS in production (automatically handled by Render)
- Consider implementing proper authentication for the admin panel
- Regularly check Render's database backups

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 