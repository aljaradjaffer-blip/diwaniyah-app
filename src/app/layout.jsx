import './globals.css';

export const metadata = {
  title: 'ديوانية شارع مكة',
  description: 'نظام إدارة ديوانية الأصدقاء والاشتراكات الشهرية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
