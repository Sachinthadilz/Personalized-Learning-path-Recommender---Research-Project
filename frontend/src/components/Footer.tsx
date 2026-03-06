import { GraduationCap } from "lucide-react";

interface FooterProps {
  onScrollTo?: (id: string) => void;
}

export default function Footer({ onScrollTo }: FooterProps) {
  const scrollTo = onScrollTo ?? ((id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  );

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-lg">LearnPath AI</span>
            </div>
            <p className="text-sm leading-relaxed">
              Empowering learners worldwide with AI-driven, personalised educational experiences.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3 text-sm">
              {["Features", "Courses", "Learning Paths", "AI Search"].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => scrollTo("features")}
                    className="hover:text-white transition-colors text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm">
              {["About Us", "Blog", "Careers", "Press"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm">
              {["Help Centre", "Contact Us", "Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} LearnPath AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
