# Walrus Data Marketplace

A decentralized data marketplace built on Walrus storage, where data providers can upload and monetize datasets while data buyers can discover, purchase, and download valuable data.

## 🚀 Quick Start

### Development Setup

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start both frontend and backend:**
   ```bash
   # Option 1: Cross-platform (recommended)
   npm run dev
   
   # Option 2: Windows batch file
   npm run dev:windows
   
   # Option 3: PowerShell (Windows)
   npm run dev:ps1
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

For detailed development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

## 🚀 Features

### For Data Providers
- **User Registration/Login** - Secure authentication with wallet or email
- **Dataset Upload** - Upload files to Walrus decentralized storage
- **Metadata Management** - Add titles, descriptions, tags, pricing
- **Sales Dashboard** - Track earnings and sales performance
- **Commission System** - Platform takes 5% commission on sales

### For Data Buyers
- **Browse & Search** - Discover datasets with advanced filtering
- **Dataset Preview** - View metadata and sample data
- **Secure Purchase** - Crypto payments with WAL/SUI tokens
- **Download Access** - Access purchased datasets from Walrus
- **Purchase History** - Track all transactions

### Platform Features
- **Decentralized Storage** - All files stored on Walrus network
- **Blockchain Payments** - Secure crypto transactions
- **Reputation System** - User ratings and reviews
- **Commission Management** - Automated fee collection
- **Responsive Design** - Works on all devices

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **Bootstrap 5** - CSS framework
- **Axios** - HTTP client
- **@mysten/sui** - Sui blockchain integration

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database for metadata
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Multer** - File upload handling

### Storage & Blockchain
- **Walrus** - Decentralized file storage
- **Sui** - Blockchain for payments
- **WAL/SUI Tokens** - Payment currencies

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/walrus-marketplace
   JWT_SECRET=your-super-secret-jwt-key
   WALRUS_RPC_URL=https://rpc.walrus.network
   WALRUS_API_KEY=your-walrus-api-key
   SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
   ```

5. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd .. # (if you're in server directory)
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🏗 Project Structure

```
walrus-client/
├── public/                 # Static files
├── src/
│   ├── components/
│   │   ├── dashboard/      # Dashboard components
│   │   ├── marketplace/    # Marketplace components
│   │   ├── upload/         # Upload components
│   │   ├── common/         # Shared components
│   │   └── LoginRegister.js
│   ├── App.js             # Main app component
│   ├── App.css            # Global styles
│   └── index.js           # Entry point
├── server/                # Backend API
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/connect-wallet` - Connect wallet

### Datasets
- `GET /api/datasets` - Browse datasets
- `GET /api/datasets/:id` - Get dataset details
- `POST /api/datasets` - Create dataset
- `PUT /api/datasets/:id` - Update dataset
- `DELETE /api/datasets/:id` - Delete dataset
- `POST /api/datasets/:id/upload` - Upload files
- `POST /api/datasets/:id/purchase` - Purchase dataset
- `GET /api/datasets/:id/download` - Download dataset

### Transactions
- `GET /api/transactions/my-transactions` - User transactions
- `GET /api/transactions/:id` - Transaction details
- `GET /api/transactions/stats/overview` - Transaction statistics
- `POST /api/transactions/:id/refund` - Request refund
- `POST /api/transactions/:id/dispute` - Create dispute

## 🎨 UI Features

### Design System
- **Dark Theme** - Modern blockchain aesthetic
- **Neon Accents** - Cyan, purple, and green highlights
- **Glassmorphism** - Semi-transparent elements
- **Smooth Animations** - Professional transitions
- **Responsive Design** - Mobile-first approach

### Components
- **Login/Register** - Secure authentication
- **Dashboard** - User overview and stats
- **Marketplace** - Dataset browsing and search
- **Upload** - Multi-step dataset creation
- **Navigation** - Intuitive app navigation

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt encryption
- **File Validation** - Type and size restrictions
- **CORS Protection** - Cross-origin security
- **Input Sanitization** - XSS prevention

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to Heroku, Vercel, or AWS
4. Set up Walrus and Sui network access

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Netlify, Vercel, or AWS S3
3. Configure API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔮 Roadmap

- [ ] Smart contract integration
- [ ] Advanced search filters
- [ ] Data visualization tools
- [ ] API rate limiting
- [ ] Email notifications
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics

---

**Built with ❤️ for the decentralized data economy**"# Syntax-Error-25" 
