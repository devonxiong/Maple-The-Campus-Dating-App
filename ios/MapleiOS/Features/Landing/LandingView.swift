import SwiftUI

struct LandingView: View {
    @EnvironmentObject var lang: LangStore
    @State private var showOnboarding = false
    @State private var showLogin = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack { Spacer(); LangToggle() }
                    .padding(.horizontal, 20).padding(.top, 8)

                Spacer()

                VStack(spacing: 18) {
                    MapleMark(size: 64)
                    Text("Maple")
                        .font(.serifTitle(52))
                        .foregroundStyle(MapleColor.ink)
                    Text(lang.t.tagline)
                        .font(.system(size: 17))
                        .foregroundStyle(MapleColor.subtle)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }

                Spacer()

                VStack(spacing: 12) {
                    Button(lang.t.getStarted) { showOnboarding = true }
                        .buttonStyle(MapleButtonStyle())
                    Button(lang.t.logIn) { showLogin = true }
                        .buttonStyle(MapleButtonStyle(filled: false))
                }
                .padding(.horizontal, 28)
                .padding(.bottom, 28)

                Text("Claremont Colleges · 5C")
                    .font(.system(size: 12))
                    .foregroundStyle(MapleColor.faint)
                    .padding(.bottom, 24)
            }
            .mapleBackground()
            .navigationDestination(isPresented: $showOnboarding) { OnboardingView() }
            .navigationDestination(isPresented: $showLogin) { LoginView() }
        }
    }
}
