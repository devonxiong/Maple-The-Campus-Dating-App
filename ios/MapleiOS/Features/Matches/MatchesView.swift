import SwiftUI

@MainActor
final class MatchesStore: ObservableObject {
    @Published var matches: [Match] = []
    @Published var isLoading = false

    func load(currentUserID: String) async {
        isLoading = true; defer { isLoading = false }
        do {
            matches = try await SupabaseREST.shared.select(
                "matches",
                columns: "*,user_a_profile:users!matches_user_a_fkey(*),user_b_profile:users!matches_user_b_fkey(*)",
                filters: [URLQueryItem(name: "or", value: "(user_a.eq.\(currentUserID),user_b.eq.\(currentUserID))")],
                order: "created_at.desc",
                as: [Match].self)
        } catch {
            print("[MatchesStore] \(error)")
        }
    }
}

struct MatchesView: View {
    @EnvironmentObject var app: AppState
    @EnvironmentObject var lang: LangStore
    @StateObject private var store = MatchesStore()

    private var t: Strings { lang.t }

    var body: some View {
        NavigationStack {
            ZStack {
                MapleColor.cream.ignoresSafeArea()
                if store.matches.isEmpty && !store.isLoading {
                    VStack(spacing: 10) {
                        MapleMark(size: 40)
                        Text(t.matchesEmpty).font(.system(size: 16)).foregroundStyle(MapleColor.subtle)
                            .multilineTextAlignment(.center).padding(.horizontal, 40)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(store.matches) { m in
                                NavigationLink { MatchView(match: m) } label: { row(m) }
                            }
                        }.padding(20)
                    }
                }
            }
            .navigationTitle(t.matchesTitle)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { LangToggle() } }
            .task { if let id = app.currentUserID { await store.load(currentUserID: id) } }
            .refreshable { if let id = app.currentUserID { await store.load(currentUserID: id) } }
        }
    }

    private func row(_ m: Match) -> some View {
        let p = m.partner(currentUserID: app.currentUserID ?? "")
        return MapleCard {
            HStack(spacing: 14) {
                Avatar(url: p?.avatarURL, name: p?.name ?? "?", size: 54)
                VStack(alignment: .leading, spacing: 4) {
                    Text(p?.name ?? "Someone").font(.system(size: 17, weight: .semibold)).foregroundStyle(MapleColor.ink)
                    Text(m.dateCard?.venue ?? (m.dateCard == nil ? t.letAiCook : "🍁"))
                        .font(.system(size: 14)).foregroundStyle(MapleColor.subtle).lineLimit(1)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(MapleColor.faint)
            }
        }
    }
}
