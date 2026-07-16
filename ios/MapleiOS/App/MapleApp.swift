import SwiftUI

@main
struct MapleApp: App {
    @StateObject private var app = AppState()
    @StateObject private var langStore = LangStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(app)
                .environmentObject(langStore)
                .tint(MapleColor.maple)
                .task { await app.bootstrap() }
        }
    }
}
