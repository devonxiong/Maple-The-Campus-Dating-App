import Foundation

/// App-wide configuration, read from Info.plist (values injected by Secrets.xcconfig).
enum AppConfig {
    static let supabaseURL: URL = {
        guard let s = infoString("MapleSupabaseURL"), let u = URL(string: s) else {
            fatalError("MapleSupabaseURL missing — copy Secrets.example.xcconfig to Secrets.xcconfig")
        }
        return u
    }()

    static let supabaseAnonKey: String = {
        guard let s = infoString("MapleSupabaseAnonKey"), !s.isEmpty else {
            fatalError("MapleSupabaseAnonKey missing — set it in Secrets.xcconfig")
        }
        return s
    }()

    /// Base URL of the deployed Next.js backend (server API routes).
    static let apiBase: URL = {
        let s = infoString("MapleAPIBase") ?? "https://www.maplemeet.ai"
        return URL(string: s) ?? URL(string: "https://www.maplemeet.ai")!
    }()

    private static func infoString(_ key: String) -> String? {
        (Bundle.main.object(forInfoDictionaryKey: key) as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
