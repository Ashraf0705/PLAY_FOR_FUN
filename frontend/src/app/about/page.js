// frontend/src/app/about/page.js
import Image from 'next/image'; // Next.js optimized image component
import Link from 'next/link';

export const metadata = {
  title: 'About PlayForFun | IPL Prediction Game',
  description: 'Learn more about PlayForFun and its creator, Ashraf.',
};

export default function AboutPage() {
  // Customize this text with your personal introduction
  const introductionText = `
    Welcome to PlayForFun! My name is Shaik Mohammed Ashraf, and I created this
    little corner of the internet to bring more fun and friendly competition to our
    IPL viewing experience.
    <br/><br/>
    The idea sparked from wanting a simple, private way for my own family and friends to
    predict match outcomes without the clutter of complex betting apps. Just pure, simple
    prediction fun!
    <br/><br/>
    I hope PlayForFun adds an extra layer of excitement to your IPL season as you compete
    with your loved ones. Enjoy the games, and may the best predictor win!
    <br/><br/>
    Feel free to reach out with any feedback or suggestions.
  `;

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto bg-gray-800 shadow-xl rounded-lg p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-indigo-400">
          About PlayForFun
        </h1>

        <div className="flex flex-col md:flex-row items-center md:items-start mb-10">
          {/* Image Section - Using your profile pic.png */}
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden mb-6 md:mb-0 md:mr-8 shadow-lg border-4 border-indigo-500 flex-shrink-0 relative">
            {/*
              Make sure 'profile pic.png' is in 'frontend/public/images/'
              The path in 'src' starts from the /public directory.
            */}
            <Image
              src="/images/profile pic.png" // <<< YOUR IMAGE PATH
              alt="Shaik Mohammed Ashraf - Creator of PlayForFun"
              layout="fill" // This makes the image fill the parent div
              objectFit="cover" // This ensures the image covers the area, might crop
              // Or use width/height if you know the exact dimensions and want to maintain aspect ratio without cropping
              // width={224}
              // height={224}
              className="rounded-full" // Ensures the image itself is rounded if parent is a circle
              priority // Optional: prioritize loading for important images
            />
          </div>

          {/* Introduction Text Section */}
          <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: introductionText.replace(/\n/g, '') }} />
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}