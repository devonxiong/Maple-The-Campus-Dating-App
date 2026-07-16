import SwiftUI

/// Loads and ranks the feed. Port of lib/score.ts (GPS boost + Spotify overlap +
/// same-campus + mutual gender compatibility), minus live presence for the first cut.
@MainActor
final class FeedStore: ObservableObject {
    @Published var cards: [FeedCard] = []
    @Published var isLoading = false
    @Published var error: String?

    func load(currentUser: MapleUser) async {
        isLoading = true; error = nil
        defer { isLoading = false }
        do {
            async let othersTask = SupabaseREST.shared.select(
                "users", filters: [URLQueryItem(name: "id", value: "neq.\(currentUser.id)")], as: [MapleUser].self)
            async let swipesTask = SupabaseREST.shared.select(
                "swipes",
                columns: "to_user,sentiment,created_at",
                filters: [URLQueryItem(name: "from_user", value: "eq.\(currentUser.id)")],
                as: [Swipe].self)

            let others = try await othersTask
            let swipes = try await swipesTask
            let swiped = Self.buildSwipedSet(swipes)
            cards = Self.buildFeed(currentUser: currentUser, others: others, swiped: swiped,
                                   totalUserCount: others.count + 1)
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Scoring (ported from lib/score.ts)

    static func buildSwipedSet(_ swipes: [Swipe]) -> Set<String> {
        let thirtyDaysAgo = Date().addingTimeInterval(-30 * 24 * 3600)
        let iso = ISO8601DateFormatter()
        return Set(swipes.filter { s in
            if s.sentiment == "pass" {
                guard let created = s.createdAt.flatMap({ iso.date(from: $0) }) else { return true }
                return created > thirtyDaysAgo
            }
            return true // like/dislike/neutral/block are permanent
        }.map { $0.toUser })
    }

    static func schoolFromEmail(_ email: String) -> String {
        let domain = email.split(separator: "@").last.map(String.init)?.lowercased() ?? ""
        switch domain {
        case "pitzer.edu", "students.pitzer.edu": return "Pitzer"
        case "pomona.edu", "mymail.pomona.edu": return "Pomona"
        case "scrippscollege.edu": return "Scripps"
        case "claremontmckenna.edu", "cmc.edu": return "CMC"
        case "hmc.edu", "g.hmc.edu": return "HMC"
        default: return "Claremont Colleges"
        }
    }

    private static func prefMatchesGender(_ prefs: [String]?, _ gender: String?) -> Bool {
        guard let prefs, let gender, !prefs.isEmpty else { return true }
        return prefs.contains { p in
            (p == "Men" && gender == "Man") ||
            (p == "Women" && gender == "Woman") ||
            (p == "Non-binary" && gender == "Non-binary")
        }
    }

    private static func mutuallyCompatible(_ a: MapleUser, _ b: MapleUser) -> Bool {
        prefMatchesGender(a.wantToDate, b.gender) && prefMatchesGender(b.wantToDate, a.gender)
    }

    private static func spotifyOverlap(_ a: MapleUser, _ b: MapleUser) -> (artists: [String], genres: [String]) {
        guard let sa = a.spotifyInterests, let sb = b.spotifyInterests else { return ([], []) }
        let artistsA = Set(sa.topArtists.map { $0.lowercased() })
        let genresA = Set(sa.genres.map { $0.lowercased() })
        return (sb.topArtists.filter { artistsA.contains($0.lowercased()) },
                sb.genres.filter { genresA.contains($0.lowercased()) })
    }

    static func buildFeed(currentUser: MapleUser, others: [MapleUser], swiped: Set<String>, totalUserCount: Int) -> [FeedCard] {
        let tinyPool = totalUserCount < 20
        return others
            .filter { !swiped.contains($0.id) }
            .compactMap { u -> FeedCard? in
                if !tinyPool && !mutuallyCompatible(currentUser, u) { return nil }
                let overlap = spotifyOverlap(currentUser, u)
                var score = 1
                score += min(overlap.artists.count * 2, 6)
                score += min(overlap.genres.count, 3)
                if let ca = currentUser.campus, let cb = u.campus, ca == cb { score += 1 }
                guard score > 0 else { return nil }
                return FeedCard(user: u, score: score,
                                hint: buildHint(currentUser, u, overlap),
                                school: schoolFromEmail(u.email))
            }
            .sorted { $0.score > $1.score }
    }

    private static func buildHint(_ a: MapleUser, _ b: MapleUser, _ overlap: (artists: [String], genres: [String])) -> String {
        if !overlap.artists.isEmpty { return "you both fw \(overlap.artists.prefix(2).joined(separator: " & ")) 🎵" }
        if !overlap.genres.isEmpty { return "shared taste in \(overlap.genres.prefix(2).joined(separator: " & ")) 🎵" }
        if let ca = a.campus, let cb = b.campus, ca == cb { return "y'all are literally on the same campus" }
        return "you two have probably crossed paths ngl"
    }
}
