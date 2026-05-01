export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] px-5 py-16">
      <div className="max-w-[680px] mx-auto">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">🍁</span>
          <span className="text-xl font-semibold text-[#111]">Maple</span>
        </div>

        <h1 className="text-3xl font-semibold text-[#111] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#9b9590] mb-10">Last updated: April 30, 2026</p>

        <div className="space-y-8 text-sm text-[#3d3a36] leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">1. Who We Are</h2>
            <p>Maple ("we", "us", "our") is a campus dating app exclusively for students at the Claremont Colleges (Pitzer, Pomona, Scripps, Claremont McKenna, and Harvey Mudd). We are operated by Maple Inc. and can be reached at <a href="mailto:hello@maplemeet.ai" className="underline">hello@maplemeet.ai</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account info:</strong> your name, school email address, gender, dating preferences, and phone number.</li>
              <li><strong>Location:</strong> approximate GPS coordinates, used only to suggest nearby date venues. Never stored long-term or shared.</li>
              <li><strong>Spotify data:</strong> top artists and genres (if you connect Spotify), used only to improve match recommendations.</li>
              <li><strong>Google Contacts:</strong> contact names and email addresses (if you connect your email), used only to show you classmates already on Maple. Never stored on our servers.</li>
              <li><strong>Usage data:</strong> swipes and match interactions, stored to power the matching algorithm.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To show you compatible matches on campus.</li>
              <li>To send you SMS notifications about matches (via Twilio).</li>
              <li>To plan date suggestions using your approximate location.</li>
              <li>To verify you are a current 5C student.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">4. Information Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong> — database hosting.</li>
              <li><strong>Twilio</strong> — SMS delivery for verification codes and match notifications.</li>
              <li><strong>Google</strong> — Maps API for date venue suggestions.</li>
              <li><strong>Anthropic / OpenAI</strong> — AI-powered date planning (no personal identifiers sent).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">5. Data Retention</h2>
            <p>Your account data is retained as long as your account exists. You may delete your account at any time by emailing <a href="mailto:hello@maplemeet.ai" className="underline">hello@maplemeet.ai</a>. Location data is not stored beyond each session.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">6. Security</h2>
            <p>We use industry-standard security practices including encrypted connections (HTTPS) and row-level security on our database. Phone numbers are used only for verification and match notifications.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">7. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:hello@maplemeet.ai" className="underline">hello@maplemeet.ai</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#111] mb-2">8. Contact</h2>
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
