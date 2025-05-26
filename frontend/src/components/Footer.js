// frontend/src/components/Footer.js
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800/70 text-gray-300 mt-auto border-t-2 border-indigo-500/30 backdrop-blur-md shadow-inner"> {/* Enhanced top border and shadow */}
      <div className="container mx-auto px-6 py-6 text-center">
        
        {/* Navigation Links - Styled more like subtle buttons */}
        <div className="mb-5 flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          <Link href="/how-to-play" className="footer-nav-link">
            How to Play
          </Link>
          <Link href="/about" className="footer-nav-link">
            About
          </Link>
          <Link href="/faq-contact" className="footer-nav-link">
            FAQ & Contact
          </Link>
        </div>

        {/* Copyright and Creator Line */}
        <p className="text-sm">
          PlayForFun © {currentYear} by <span className="font-bold text-indigo-300 hover:text-indigo-200 transition-colors">Shaik Mohammed Ashraf</span>.
        </p>
        {/* Optional: A very subtle secondary line if needed in future, or remove */}
        {/* <p className="text-xs text-gray-500 mt-1">All predictions are just for fun!</p> */}

      </div>
    </footer>
  );
}