
# Smart Department Budget Management & Expense Analytics System

An advanced, digital solution for academic departments to streamline budget planning, track real-time expenses, verify receipts, and generate insightful analytics. 

## 🚀 Overview

This project addresses the challenges faced by academic departments in managing annual budgets. By replacing traditional spreadsheets with a centralized web application, it ensures transparency, accelerates approval cycles, and simplifies audit compliance (NBA/NAAC).

## 🛠️ Tech Stack

This project leverages a modern, serverless architecture for performance, scalability, and ease of deployment.

### **Frontend**
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router) - React Framework for the Web.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for rapid UI development.
- **Components:** [React](https://react.dev/), [Lucide React](https://lucide.dev/) (Icons).
- **Charts:** [Recharts](https://recharts.org/) - Composable charting library for React components.
- **Tables:** [@tanstack/react-table](https://tanstack.com/table/v8) - Headless UI for building powerful tables.

### **Backend**
- **Runtime:** [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) (Serverless Functions).
- **Validation:** [Zod](https://zod.dev/) - TypeScript-first schema declaration and validation library.
- **Authentication:** [Jose](https://github.com/panva/jose) - lightweight JWT implementation.
- **Security:** [Bcryptjs](https://www.npmjs.com/package/bcryptjs) - Password hashing.

### **Database**
- **Provider:** [Neon DB](https://neon.tech/) - Serverless Postgres.
- **Driver:** [@neondatabase/serverless](https://www.npmjs.com/package/@neondatabase/serverless) - Low-latency driver for serverless environments.
- **Schema Management:** Raw SQL migrations (custom scripts).

### **Storage**
- **Provider:** [Cloudinary](https://cloudinary.com/) - Cloud-based image and video management.
- **Usage:** Secure storage for expense receipts and documents.

### **Report System**
- **PDF Generation:** [PDFKit](https://pdfkit.org/) - Complex PDF document generation (Official Reports).
- **PDF Manipulation:** [pdf-lib](https://pdf-lib.js.org/) - Create and modify PDF documents.
- **Excel Exports:** [ExcelJS](https://github.com/exceljs/exceljs) - Excel workbook manager (Data Exports).

### **Deployment & DevOps**
- **Platform:** [Vercel](https://vercel.com/) - Frontend and Serverless Function hosting.
- **CI/CD:** Vercel for Git integration (automatic deployments).

## ✨ Key Features

- **Budget Planning:** Create comprehensive budgets with breakdowns (e.g., equipment, events, FDPs).
- **Expense Tracking:** Real-time logging of expenses against specific budget allocations.
- **Receipt Management:** Upload and verify receipts effortlessly with Cloudinary integration.
- **Role-Based Access Control:**
  - **Admin:** Full system control, user management.
  - **HOD:** Approval authority for budgets and high-value expenses.
  - **Staff:** Expense submission and tracking.
- **Analytics Dashboard:** Visualize spending trends, category-wise breakdowns, and remaining funds.
- **Report Generation:** One-click PDF and Excel reports for audits and accreditation.

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Neon DB account
- A Cloudinary account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/smart-dept-budget.git
   cd smart-dept-budget
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@ep-cool-project-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # Authentication
   JWT_SECRET="your-super-secret-jwt-key"

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. **Initialize Database:**
   Run the migration/seed script to set up tables and initial data.
   ```bash
   # Seeds the database with demo data
   npm run seed
   
   # Or explicitly reset and seed:
   npx tsx scripts/seed.ts --reset
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
├── migrations/         # SQL migration files
├── public/             # Static assets
├── scripts/            # Database seeding and utility scripts
├── src/
│   ├── app/            # Next.js App Router (Pages & API)
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utility functions (db, auth, excel, pdf)
│   └── services/       # Business logic services
├── .env.local          # Environment variables (not committed)
└── package.json        # Project dependencies and scripts
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
