import SwiftUI

struct MatchView: View {
    @EnvironmentObject var app: AppState
    @EnvironmentObject var lang: LangStore
    @Environment(\.dismiss) private var dismiss

    let match: Match
    @State private var dateCard: DateCard?
    @State private var cooking = false
    @State private var error: String?

    private var t: Strings { lang.t }
    private var partner: MapleUser? { match.partner(currentUserID: app.currentUserID ?? "") }

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                header
                if let card = dateCard {
                    dateCardView(card)
                } else if cooking {
                    cookingView
                } else {
                    reveal
                }
                if let error {
                    Text(error).font(.system(size: 14)).foregroundStyle(MapleColor.maple)
                }
            }
            .padding(20)
        }
        .mapleBackground()
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .topBarTrailing) {
            Button(t.backFeed) { dismiss() }.font(.system(size: 14)).foregroundStyle(MapleColor.subtle)
        } }
        .onAppear { dateCard = match.dateCard }
    }

    private var header: some View {
        VStack(spacing: 12) {
            Text(t.revealTitle).font(.serifTitle(30)).foregroundStyle(MapleColor.ink)
            Text(t.revealSub).font(.system(size: 15)).foregroundStyle(MapleColor.subtle)
            if let p = partner {
                Avatar(url: p.avatarURL, name: p.name, size: 110)
                Text(p.name).font(.serifTitle(24)).foregroundStyle(MapleColor.ink)
            }
        }
        .padding(.top, 8)
    }

    private var reveal: some View {
        Button(t.letAiCook) { Task { await cook() } }
            .buttonStyle(MapleButtonStyle())
    }

    private var cookingView: some View {
        MapleCard {
            VStack(spacing: 14) {
                ProgressView().tint(MapleColor.maple)
                Text(t.cookingTitle).font(.system(size: 17, weight: .semibold)).foregroundStyle(MapleColor.ink)
                Text(t.cookingSub).font(.system(size: 14)).foregroundStyle(MapleColor.subtle)
            }.frame(maxWidth: .infinity).padding(.vertical, 12)
        }
    }

    private func dateCardView(_ card: DateCard) -> some View {
        VStack(spacing: 16) {
            Text(t.dateCooked).font(.serifTitle(24)).foregroundStyle(MapleColor.ink)
            MapleCard {
                VStack(alignment: .leading, spacing: 16) {
                    labeled(t.whenLabel, card.time)
                    labeled(t.whereLabel, [card.venue, card.address].compactMap { $0 }.joined(separator: "\n"))
                    if let n = card.walkMinutes { Text("~\(n) min walk each").font(.system(size: 13)).foregroundStyle(MapleColor.faint) }
                    if let ctx = card.sharedContext { labeled(t.inCommon, ctx) }
                    if let ice = card.icebreaker { labeled(t.convStarter, ice) }
                    if let maps = card.mapsURL, let u = URL(string: maps) {
                        Link(t.openMaps, destination: u).font(.system(size: 15, weight: .semibold)).foregroundStyle(MapleColor.maple)
                    }
                }
            }
            Button(t.imInGo) { Task { await shareContact() }; dismiss() }
                .buttonStyle(MapleButtonStyle())
        }
    }

    private func labeled(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.system(size: 11, weight: .bold)).foregroundStyle(MapleColor.faint).tracking(0.6)
            Text(value).font(.system(size: 16)).foregroundStyle(MapleColor.ink)
        }
    }

    private func cook() async {
        cooking = true; error = nil
        defer { cooking = false }
        do {
            dateCard = try await BackendAPI.shared.planDate(matchId: match.id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func shareContact() async {
        guard let me = app.currentUserID else { return }
        try? await BackendAPI.shared.shareContact(matchId: match.id, fromUserId: me)
    }
}
