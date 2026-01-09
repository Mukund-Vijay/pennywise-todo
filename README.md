# 🎈 Welcome to Derry - Todo App

A horror-themed todo application inspired by Pennywise from IT. Available as both Desktop and Mobile app!

## 📱 Features

- ✅ Weekly task scheduling with single-day assignment
- 📊 Weekly productivity analytics
- 🏆 Most/Least productive day tracking
- 🎪 Horror-themed Pennywise UI
- 💾 Offline support (PWA)
- 🖥️ Desktop app (Electron)
- 📱 Mobile app (PWA)

## 🚀 Installation

### Prerequisites
```bash
npm install
```

## 💻 Desktop App (Electron)

### Option 1: Using npm script
```bash
npm run app
```

### Option 2: Manual
```bash
# Terminal 1 - Start server
npm start

# Terminal 2 - Start Electron
npm run electron
```

## 📱 Mobile App (PWA)

### 1. Start the Server
```bash
npm start
```

### 2. Access on Your Phone

#### For Android:
1. Open Chrome browser on your Android phone
2. Visit `http://YOUR-COMPUTER-IP:3000`
3. Tap the menu (⋮) → "Install app" or "Add to Home screen"
4. The app will be installed and available like a native app

#### For iPhone/iPad:
1. Open Safari browser on your iOS device
2. Visit `http://YOUR-COMPUTER-IP:3000`
3. Tap the Share button (□↑)
4. Scroll down and tap "Add to Home Screen"
5. Tap "Add" in the top right

#### For Desktop Browser:
1. Visit `http://localhost:3000`
2. Look for the install icon in the address bar (usually a ⊕ or computer icon)
3. Click "Install" to add as a desktop app

### Find Your Computer IP:

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (usually starts with 192.168.x.x)

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

## 🎯 Usage

### Adding Tasks
1. Type your task in the input field
2. Select ONE day of the week (radio button)
3. Click "ADD" button

### Viewing Tasks
- Tasks are organized by day
- Today's day is highlighted in gold
- Check tasks off when completed

### Weekly Summary
1. Click "📊 Weekly Summary" button
2. View:
   - Total tasks scheduled
   - Completion rate
   - On-time completion rate
   - Most productive day 🏆
   - Least productive day ⚠️
   - Daily breakdown with visual progress bars

## 🔧 Development

### Dev Mode with Auto-reload
```bash
npm run dev
```

### File Structure
```
pennywise-todo/
├── database/           # JSON database
├── middleware/         # Auth middleware
├── routes/            # API routes
├── public/            # Frontend files
├── electron-main.js   # Electron app
├── server.js          # Express server
├── service-worker.js  # PWA service worker
└── manifest.json      # PWA manifest
```

## 🎨 Generating Icons

1. Open `generate-icons.html` in a browser
2. Right-click on each canvas and "Save Image As"
3. Save as `icon-192.png` and `icon-512.png` in the `public/` folder

## 🌐 Network Access

To access from other devices on your network:
1. Make sure your computer and phone are on the same WiFi network
2. Configure your firewall to allow port 3000
3. Use your computer's local IP address

## 📝 API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `GET /api/todos/summary/weekly` - Get weekly summary

## 🎪 Horror Theme

The app features:
- Pennywise-inspired red and black color scheme
- Creepy fonts (Creepster)
- Red balloon animations
- Ambient horror sounds
- Spooky notification effects

## 🔐 Security

- JWT authentication
- bcrypt password hashing
- Protected API routes

## 📄 License

MIT

---

**"We all float down here... with our tasks"** 🎈🤡
