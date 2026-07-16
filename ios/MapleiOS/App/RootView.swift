import SwiftUI

struct RootView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        Group {
            if app.isSignedIn {
                MainTabView()
                    .transition(.opacity)
            } else {
                LandingView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut, value: app.isSignedIn)
    }
}

struct MainTabView: View {
    @EnvironmentObject var lang: LangStore

    var body: some View {
        TabView {
            FeedView()
                .tabItem { Label(lang.t.tabFeed, systemImage: "sparkles") }
            MatchesView()
                .tabItem { Label(lang.t.tabMatches, systemImage: "heart.fill") }
            ProfileView()
                .tabItem { Label(lang.t.tabMe, systemImage: "person.fill") }
        }
        .tint(MapleColor.maple)
    }
}
