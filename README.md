
# Smart Department Budget Management & Expense Analytics System

An advanced, digital solution for academic departments to streamline budget planning, track real-time expenses, verify receipts, and generate insightful analytics. 

## Overview

This project addresses the challenges faced by academic departments in managing annual budgets. By replacing traditional spreadsheets with a centralized web application, it ensures transparency, accelerates approval cycles, and simplifies audit compliance (NBA/NAAC).

## Tech Stack

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

## Key Features

- **Budget Planning:** Create comprehensive budgets with breakdowns (e.g., equipment, events, FDPs).
- **Expense Tracking:** Real-time logging of expenses against specific budget allocations.
- **Receipt Management:** Upload and verify receipts effortlessly with Cloudinary integration.
- **Role-Based Access Control:**
  - **Admin:** Full system control, user management.
  - **HOD:** Approval authority for budgets and high-value expenses.
  - **Staff:** Expense submission and tracking.
- **Analytics Dashboard:** Visualize spending trends, category-wise breakdowns, and remaining funds.
- **Report Generation:** One-click PDF and Excel reports for audits and accreditation.


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


## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
