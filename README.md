<p align="center">
  <img src="public/logo.png" alt="786 Spare Parts Logo" width="150" height="150">
</p>

<h1 align="center">786 Spare Parts</h1>

<p align="center">
  <strong>Complete Wholesale Import-Export & Finance Management System</strong>
</p>

<p align="center">
  A full-featured ERP solution for tractor spare parts wholesale business with inventory management, invoicing, customer/supplier ledgers, and comprehensive financial tracking.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 📦 Inventory Management
- **Product Catalog**: Complete product management with categories, units, and stock tracking
- **Opening Stock & Cost**: Track initial inventory with opening stock and cost values
- **Real-time Stock Updates**: Automatic stock adjustments on imports and sales
- **Stock Movements**: Complete audit trail of all inventory changes

### 📥 Import Management
- **Multi-currency Support**: Import invoices in PKR, USD, AED, CNY with exchange rates
- **Supplier Management**: Complete supplier profiles with contact info and ledger tracking
- **All-in-One Invoice Creation**: Single modal for adding items, setting prices, and finalizing
- **Credit/Cash Tracking**: Separate handling for cash and credit purchases
- **Automatic Payables**: Credit imports automatically update supplier ledger

### 💰 Sales Management
- **Quick Invoice Creation**: All-in-one modal with customer selection, items, and discount
- **Percentage Discounts**: Apply discount percentage on subtotal
- **Cash & Credit Sales**: Support for both payment types
- **Customer Ledger Integration**: Credit sales automatically update customer receivables
- **Print-ready Invoices**: Professional invoice printing with all details

### 💳 Payment Management
- **Cash Payments**: Record payments made to suppliers
- **Cash Received**: Track payments received from customers
- **Credit Vouchers**: Issue credit vouchers for customers
- **General Ledger**: Complete view of all financial transactions

### 📊 Dashboard & Reports
- **Real-time Analytics**: Live dashboard with key business metrics
- **Stock Value Calculation**: Accurate inventory valuation from import costs
- **Total Receivables**: Customer outstanding amounts at a glance
- **Total Payables**: Supplier dues tracking
- **PDF Export**: Export reports and invoices to PDF

### 👥 Customer & Supplier Management
- **Complete Profiles**: Name, phone, city, address management
- **Ledger Balance Tracking**: Automatic balance updates from transactions
- **Inline Creation**: Add new customers/suppliers directly from invoice forms
- **Individual Ledger Views**: Detailed transaction history per party

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Role-based access control
- **Password Hashing**: Secure password storage with bcrypt

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| Vite | 7.2.4 | Build Tool |
| TailwindCSS | 4.1.18 | Styling |
| React Router DOM | 6.20.0 | Routing |
| Axios | 1.6.0 | HTTP Client |
| React Hot Toast | 2.6.0 | Notifications |
| React Icons | 4.12.0 | Icon Library |
| Headless UI | 2.2.9 | UI Components |
| jsPDF | 3.0.4 | PDF Generation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 5.2.1 | Web Framework |
| PostgreSQL | 16+ | Database |
| pg | 8.16.3 | PostgreSQL Client |
| JWT | 9.0.3 | Authentication |
| bcryptjs | 3.0.3 | Password Hashing |
| CORS | 2.8.5 | Cross-Origin Support |
| dotenv | 17.2.3 | Environment Config |

---

## 📁 Project Structure

```
786-spareparts/
├── public/
│   └── logo.png                 # Application logo
├── src/
│   ├── assets/                  # Static assets
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── SelectInput.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   ├── ConfirmationModal.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── Header.tsx           # App header
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Layout.tsx           # Main layout wrapper
│   │   ├── PrintInvoice.tsx     # Invoice print template
│   │   └── ProtectedRoute.tsx   # Auth route guard
│   ├── hooks/
│   │   └── useCurrencyConverter.ts
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── Products.tsx         # Product management
│   │   ├── Suppliers.tsx        # Supplier management
│   │   ├── Customers.tsx        # Customer management
│   │   ├── Imports.tsx          # Import invoices
│   │   ├── Sales.tsx            # Sales invoices
│   │   ├── Payments.tsx         # Payment management
│   │   ├── CashPayment.tsx      # Supplier payments
│   │   ├── CashReceived.tsx     # Customer payments
│   │   ├── CreditVoucher.tsx    # Credit vouchers
│   │   ├── GeneralLedger.tsx    # All transactions
│   │   ├── CustomerLedgerDetails.tsx
│   │   ├── Reports.tsx          # Reports & analytics
│   │   ├── Profile.tsx          # User profile
│   │   └── Login.tsx            # Authentication
│   ├── services/
│   │   └── api.ts               # API configuration
│   ├── utils/
│   │   └── pdfExport.ts         # PDF export utilities
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # Global styles
│   ├── main.tsx                 # App entry point
│   └── index.css                # Tailwind imports
├── server/
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── products.js          # Product CRUD
│   │   ├── suppliers.js         # Supplier CRUD
│   │   ├── customers.js         # Customer CRUD
│   │   ├── imports.js           # Import invoice management
│   │   ├── sales.js             # Sales invoice management
│   │   ├── payments.js          # Payment processing
│   │   ├── ledger.js            # Ledger queries
│   │   ├── dashboard.js         # Dashboard statistics
│   │   └── categories.js        # Category management
│   ├── middleware/
│   │   └── authorization.js     # JWT verification
│   ├── db.js                    # Database connection
│   ├── database.sql             # Database schema
│   ├── index.js                 # Server entry point
│   └── package.json             # Server dependencies
├── index.html                   # HTML template
├── package.json                 # Frontend dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
├── eslint.config.js             # ESLint configuration
└── README.md                    # This file
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** or **yarn**

### Clone the Repository
```bash
git clone https://github.com/yourusername/786-spareparts.git
cd 786-spareparts
```

### Install Frontend Dependencies
```bash
npm install
```

### Install Backend Dependencies
```bash
cd server
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables
Create a `.env` file in the `server` directory:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sparepartsdb

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
```

### Frontend API Configuration
The API base URL is configured in `src/services/api.ts`:
```typescript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
```

---

## 🗄️ Database Setup

### 1. Create Database
```sql
CREATE DATABASE sparepartsdb;
```

### 2. Run Schema
Execute the SQL file to create all tables:
```bash
psql -U postgres -d sparepartsdb -f server/database.sql
```

### 3. Database Schema Overview

| Table | Description |
|-------|-------------|
| `users` | System users with authentication |
| `products` | Product catalog with stock tracking |
| `suppliers` | Supplier profiles and ledger |
| `customers` | Customer profiles and ledger |
| `import_invoices` | Import purchase invoices |
| `import_items` | Line items for imports |
| `sales_invoices` | Sales invoices with discount support |
| `sales_items` | Line items for sales |
| `payments` | All payment transactions |
| `stock_movements` | Inventory audit trail |

---

## 📖 Usage

### Start the Backend Server
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

### Start the Frontend
```bash
npm run dev
```
Application runs on `http://localhost:5173`

### Default Admin Credentials
```
Email: admin@test.com
Password: 123456
```

### Build for Production
```bash
# Frontend build
npm run build

# Preview production build
npm run preview
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/verify` | Verify JWT token |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | Get all invoices |
| GET | `/api/sales/:id` | Get invoice with items |
| POST | `/api/sales/create-complete` | Create & finalize invoice |
| POST | `/api/sales/:id/items` | Add item to draft |
| POST | `/api/sales/:id/finalize` | Finalize invoice |

### Imports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/imports` | Get all imports |
| POST | `/api/imports/create-complete` | Create & finalize import |
| POST | `/api/imports/:id/items` | Add item to draft |
| POST | `/api/imports/:id/finalize` | Finalize import |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | Get all payments |
| POST | `/api/payments` | Create payment |
| GET | `/api/payments/customer/:id` | Customer payments |
| GET | `/api/payments/supplier/:id` | Supplier payments |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

---

## 🎨 Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Cream | `#EBE0C0` | Backgrounds, borders |
| Primary Dark | `#242A2A` | Text, headings |
| White | `#FFFFFF` | Cards, modals |
| Light Background | `#FAFAF5` | Page background |

---

## 🖼️ Screenshots

### Dashboard
Modern dashboard with real-time statistics showing stock value, receivables, payables, and recent activity.

### Sales Invoice
All-in-one invoice creation with customer selection, product items, percentage discount, and instant finalization.

### Import Management
Multi-currency import invoices with automatic exchange rate conversion and supplier ledger updates.

### Payment Tracking
Complete payment management for customers and suppliers with cash, bank, and credit voucher support.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**786 Spare Parts**

- Wholesale Tractor Spare Parts
- Import & Export Business Management

---

<p align="center">
  Made with ❤️ for the spare parts industry
</p>

<p align="center">
  <strong>© 2025 786 Spare Parts. All Rights Reserved.</strong>
</p>
