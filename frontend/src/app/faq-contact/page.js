// frontend/src/app/faq-contact/page.js
// This can be a Server Component as it's mostly static
import Link from 'next/link';

export const metadata = {
  title: 'FAQ & Contact | PlayForFun',
  description: 'Find answers to frequently asked questions and how to contact us for PlayForFun.',
};

const faqs = [
  {
    question: "How do I create a prediction space?",
    answer: "Navigate to 'Create Space' from the header or Admin Actions page. You'll set a space name, an admin password for that space, and the system will generate a unique Join Code for you to share."
  },
  {
    question: "How do I join an existing space?",
    answer: "You need a 'Join Code' from your Space Admin. Go to 'Join Space', enter the code and your desired username for that space."
  },
  {
    question: "I'm an Admin. How do I add matches?",
    answer: "Log in as an Admin for your space. Go to 'Admin Panel' > 'Manage Matches'. You can add new matches there, including setting the prediction deadline."
  },
  {
    question: "When are points calculated?",
    answer: "Points are automatically calculated and updated for all users in a space after the Space Admin enters the official result for a completed match."
  },
  {
    question: "How does the weekly leaderboard work?",
    answer: "The weekly leaderboard tracks points earned from predictions on matches whose results were entered by the admin within the current week (Wednesday to Tuesday). It resets every Wednesday."
  },
  {
    question: "Can an Admin also play/predict in their own space?",
    answer: "Not with their admin login. Admins manage the game. If an admin wants to play, they should join their space as a regular user with a different username."
  },
  {
    question: "I forgot my Admin Password for my space. What do I do?",
    answer: "Currently, there is no automated password recovery. Please try to remember your password. For critical issues, you might need to contact the site owner."
  },
  // Add more FAQs as you think of them
];

const contactEmail = "smdashraf01@gmail.com";

export default function FAQContactPage() {
  return (
    <div className="py-10 px-4">
      <div className="max-w-4xl mx-auto bg-gray-800 shadow-xl rounded-2xl p-8 md:p-12 border border-gray-700">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-indigo-400 tracking-tight">
          FAQ & Contact Us
        </h1>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-300 mb-6 border-b-2 border-purple-500/50 pb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <h2 className="text-3xl font-bold text-green-300 mb-6 border-b-2 border-green-500/50 pb-3">
            Contact & Support
          </h2>
          <div className="text-gray-300 leading-relaxed prose prose-lg prose-invert max-w-none space-y-4">
            <p>
              If you have any other questions, suggestions for improvement, or if you encounter any problems while using PlayForFun, please don't hesitate to reach out!
            </p>
            <p>
              The best way to contact us is by sending an email to:
            </p>
            <p className="text-center my-4">
              <a 
                href={`mailto:${contactEmail}?subject=PlayForFun Inquiry`} 
                className="form-button inline-block w-auto px-6 py-3 text-base bg-green-600 hover:bg-green-700 focus:ring-green-500"
              >
                Email me: {contactEmail}
              </a>
            </p>
            <p>
              We appreciate your feedback and will do our best to assist you!
            </p>
          </div>
        </section>

         <div className="text-center mt-16">
          <Link
            href="/"
            className="form-button w-auto px-10 py-3 inline-block text-base"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}