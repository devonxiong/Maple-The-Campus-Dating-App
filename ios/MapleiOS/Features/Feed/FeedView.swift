import SwiftUI

struct FeedView: View {
    @EnvironmentObject var app: AppState
    @EnvironmentObject var lang: LangStore
    @StateObject private var store = FeedStore()

    @State private var toast: ToastData?
    @State private var matchToShow: Match?
    @State private var reportTarget: MapleUser?

    private var t: Strings { lang.t }

    var body: some View {
        NavigationStack {
            ZStack {
                MapleColor.cream.ignoresSafeArea()
                if store.isLoading && store.cards.isEmpty {
                    ProgressView().tint(MapleColor.maple)
                } else if let top = store.cards.first {
                    cardStack(top: top)
                } else {
                    emptyState
                }
            }
            .navigationTitle("Maple")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { LangToggle() } }
            .toast($toast)
            .task { await reload() }
            .refreshable { await reload() }
            .sheet(item: $matchToShow) { m in
                NavigationStack { MatchView(match: m) }
            }
            .confirmationDialog("Report", isPresented: Binding(
                get: { reportTarget != nil }, set: { if !$0 { reportTarget = nil } }
            ), titleVisibility: .visible) {
                ForEach(["Inappropriate messages", "Fake profile", "Harassment", "Spam", "Other"], id: \.self) { reason in
                    Button(reason, role: .destructive) { if let u = reportTarget { Task { await report(u, reason) } } }
                }
                Button(t.cancel, role: .cancel) {}
            }
        }
    }

    private func cardStack(top: FeedCard) -> some View {
        VStack(spacing: 20) {
            Spacer(minLength: 0)
            personCard(top)
            actionButtons(top)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 20)
    }

    private func personCard(_ card: FeedCard) -> some View {
        MapleCard {
            VStack(spacing: 14) {
                Avatar(url: card.user.avatarURL, name: card.user.name, size: 120)
                Text(card.user.name).font(.serifTitle(28)).foregroundStyle(MapleColor.ink)
                Text(lang.school(card.school))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(MapleColor.subtle)
                Text(card.hint)
                    .font(.system(size: 15))
                    .foregroundStyle(MapleColor.faint)
                    .multilineTextAlignment(.center)
                if let spots = card.user.topSpots, !spots.isEmpty {
                    FlowLayout(spacing: 6) {
                        ForEach(spots.prefix(3), id: \.self) { s in
                            Text("📍 \(s)").font(.system(size: 12))
                                .padding(.horizontal, 10).padding(.vertical, 5)
                                .background(MapleColor.cream)
                                .clipShape(Capsule())
                                .foregroundStyle(MapleColor.subtle)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    private func actionButtons(_ card: FeedCard) -> some View {
        VStack(spacing: 12) {
            Button(t.cardShoot) { Task { await swipe(card.user, "like") } }
                .buttonStyle(MapleButtonStyle())
            HStack(spacing: 12) {
                Button(t.cardPass) { Task { await swipe(card.user, "pass") } }
                    .buttonStyle(MapleButtonStyle(filled: false))
                Button(t.block) { Task { await swipe(card.user, "block") } }
                    .buttonStyle(MapleButtonStyle(filled: false))
            }
            Button(t.report) { reportTarget = card.user }
                .font(.system(size: 13)).foregroundStyle(MapleColor.faint)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            MapleMark(size: 44)
            Text(t.seenEveryone).font(.serifTitle(24)).foregroundStyle(MapleColor.ink)
            Text(t.seenEveryoneSub)
                .font(.system(size: 15)).foregroundStyle(MapleColor.subtle)
                .multilineTextAlignment(.center)
            Button(t.openBox) { Task { await openBlindBox() } }
                .buttonStyle(MapleButtonStyle())
                .padding(.top, 8)
        }
        .padding(32)
    }

    // MARK: - Actions

    private func reload() async {
        guard let user = app.currentUser else {
            if let id = app.currentUserID { await app.refreshUser(id: id) }
            if let user = app.currentUser { await store.load(currentUser: user) }
            return
        }
        await store.load(currentUser: user)
    }

    private func swipe(_ target: MapleUser, _ sentiment: String) async {
        guard let me = app.currentUserID else { return }
        withAnimation { store.cards.removeAll { $0.id == target.id } }
        do {
            try await SupabaseREST.shared.upsert(
                "swipes",
                body: ["from_user": me, "to_user": target.id, "sentiment": sentiment],
                onConflict: "from_user,to_user")
            switch sentiment {
            case "like":
                toast = ToastData(message: t.tShotSent)
                if let match = try await findMatch(me: me, other: target.id) { matchToShow = match }
            case "pass": toast = ToastData(message: t.tGone30)
            case "block": toast = ToastData(message: t.tBlocked)
            default: break
            }
        } catch {
            toast = ToastData(message: "Something went wrong.")
        }
    }

    /// After a like, the DB trigger may have created a match. Look it up.
    private func findMatch(me: String, other: String) async throws -> Match? {
        let a = min(me, other), b = max(me, other)
        let rows = try await SupabaseREST.shared.select(
            "matches",
            columns: "*,user_a_profile:users!matches_user_a_fkey(*),user_b_profile:users!matches_user_b_fkey(*)",
            filters: [URLQueryItem(name: "user_a", value: "eq.\(a)"),
                      URLQueryItem(name: "user_b", value: "eq.\(b)")],
            limit: 1, as: [Match].self)
        return rows.first
    }

    private func report(_ user: MapleUser, _ reason: String) async {
        guard let me = app.currentUserID else { return }
        withAnimation { store.cards.removeAll { $0.id == user.id } }
        try? await BackendAPI.shared.report(reporterId: me, reportedId: user.id, reason: reason)
        toast = ToastData(message: "reported & blocked")
    }

    private func openBlindBox() async {
        guard let me = app.currentUserID else { return }
        do {
            let res = try await BackendAPI.shared.openBlindBox(requesterId: me)
            if res["success"] as? Bool == true {
                toast = ToastData(message: "🎁 Sent! Waiting for them…")
            } else {
                toast = ToastData(message: "No one available right now — try later")
            }
        } catch {
            toast = ToastData(message: "Could not send — try again")
        }
    }
}
