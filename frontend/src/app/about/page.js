// frontend/src/app/about/page.js
// This can remain a Server Component
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'The Story Behind PlayForFun | IPL Prediction Game', // More engaging title
  description: 'Meet Ashraf, the creator of PlayForFun, and discover the passion behind this family-focused IPL prediction game.',
};

export default function AboutPage() {
  // Feel free to personalize this text even more!
  const storyText = [
    {
      type: 'paragraph',
      content: "Hey there! I'm Shaik Mohammed Ashraf, the cricket enthusiast and developer who sparked PlayForFun into existence. This platform was born from a simple idea: to make following the IPL even more engaging for my own family and friends."
    },
    {
      type: 'paragraph',
      content: "I wanted to create a private, fun-filled space where we could all share our predictions, enjoy some friendly rivalry, and connect over the thrill of the matches – all without the complexity of mainstream betting apps. Just pure, simple prediction excitement, designed for the joy of the game and the spirit of togetherness."
    },
    {
      type: 'heading',
      level: 3, // Corresponds to h3
      content: "My Mission: Fun First!"
    },
    {
      type: 'paragraph',
      content: "PlayForFun is all about enhancing your IPL experience. It's about those 'I told you so!' moments, the friendly banter, and a shared activity that brings everyone closer, one prediction at a time. The simple rules and straightforward point system are designed so everyone can jump in and enjoy."
    },
    {
      type: 'paragraph',
      content: "I truly hope PlayForFun adds a vibrant layer of excitement to your IPL season. Dive in, make your predictions, track the leaderboards, and most importantly – have a fantastic time competing with your loved ones!"
    },
    {
      type: 'paragraph',
      content: "Got feedback or a cool idea? I'd love to hear it! You can reach out via the Contact page."
    }
  ];

  return (
    <div className="py-12 md:py-16 px-4 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/20"> {/* Added a subtle gradient background */}
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">The Story of PlayForFun</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Bringing families and friends closer, one IPL prediction at a time.
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="bg-gray-800/70 backdrop-blur-md shadow-2xl rounded-2xl p-8 md:p-12 border border-gray-700/50">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 md:gap-12">
            {/* Image Section */}
            <div className="lg:w-1/3 flex-shrink-0 w-full flex justify-center lg:justify-start">
              <div className="w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden shadow-xl border-4 border-indigo-500/70 relative transform transition-all duration-500 hover:scale-105 hover:shadow-purple-500/30">
                <Image
                  src="/images/profile pic.png" // Your image path
                  alt="Shaik Mohammed Ashraf - Creator of PlayForFun"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                  priority
                />
              </div>
            </div>

            {/* Text Content Section */}
            <div className="lg:w-2/3 text-gray-300 leading-relaxed space-y-5 prose prose-lg prose-invert max-w-none">
              {storyText.map((item, index) => {
                if (item.type === 'heading') {
                  return <h3 key={index} className="text-2xl font-semibold text-indigo-300 !mt-8 !mb-3">{item.content}</h3>; // Tailwind prose overrides need !
                }
                return <p key={index} dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br/>') }} />;
              })}
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="text-center mt-12 md:mt-16">
          <Link
            href="/"
            className="form-button w-auto px-10 py-3 inline-block text-base bg-purple-600 hover:bg-purple-700 focus:ring-purple-500" // Matched a homepage button color
          >
            Explore the Fun!
          </Link>
        </div>
      </div>
    </div>
  );
}