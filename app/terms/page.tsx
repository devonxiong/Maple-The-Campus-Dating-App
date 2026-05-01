export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] px-5 py-16">
      <div className="max-w-[680px] mx-auto">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">🍁</span>
          <span className="text-xl font-semibold text-[#111]">Maple</span>
        </div>

        <h1 className="text-3xl font-semibold text-[#111] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#9b9590] mb-10">Last updated: April 30, 2026</p>

        <div className="space-y-8 text-sm text-[#3d3a36] leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">1. Eligibility</h2>
            <p>Maple is exclusively for current students of the Claremont Colleges (Pitzer, Pomona, Scripps, Claremont McKenna, and Harvey Mudd). You must be at least 18 years old and have a valid 5C student email address to use Maple.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">2. Your Account</h2>
            <p>You are responsible for maintaining the accuracy of your account information. You may not create an account on behalf of someone else or use a school email you do not own. One account per person.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Harass, threaten, or harm other users.</li>
              <li>Use Maple for any commercial or non-personal purpose.</li>
              <li>Attempt to reverse-engineer or abuse the platform.</li>
              <li>Create fake accounts or misrepresent your identity.</li>
              <li>Share another user's information without their consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">4. Matches and Interactions</h2>
            <p>Maple shows you other students anonymously until a mutual match occurs. Match notifications are sent via SMS. We do not guarantee any specific number of matches or outcomes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">5. AI-Planned Dates</h2>
            <p>When you and another user match, Maple may suggest a date venue using AI and location data. These suggestions are provided for convenience only and are not guarantees of availability, safety, or suitability.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">6. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting <a href="mailto:hello@maplemeet.ai" className="underline">hello@maplemeet.ai</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">7. Disclaimer</h2>
            <p>Maple is provided "as is" without warranties of any kind. We are not responsible for interactions between users that occur outside the platform. Use good judgment and stay safe.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">8. Changes</h2>
            <p>We may update these terms from time to time. Continued use of Maple after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">9. Contact</h2>
            <p>Questions? Email us at <a href="mailto:hello@maplemeet.ai" className="underline">hello@maplemeet.ai</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[#e8e6e1]">
          <a href="/" className="text-sm text-[#9b9590] hover:text-[#111] transition-colors">← back to Maple</a>
        </div>
      </div>
    </main>
  )
}
