// frontend/src/app/layout.js
import './globals.css';
import Header from '@/components/Header';         // Using alias
import Footer from '@/components/Footer';         // Using alias
import { AuthProvider } from '@/contexts/AuthContext'; // Using alias

export const metadata = {
  title: 'PlayForFun - IPL Prediction Game',
  description: 'Join your private IPL prediction space and compete with family & friends!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}