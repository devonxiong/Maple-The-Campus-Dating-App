import SwiftUI
import PhotosUI

struct ProfileView: View {
    @EnvironmentObject var app: AppState
    @EnvironmentObject var lang: LangStore

    @State private var pickerItem: PhotosPickerItem?
    @State private var uploading = false
    @State private var toast: ToastData?
    @State private var showDeleteConfirm = false

    private var t: Strings { lang.t }
    private var user: MapleUser? { app.currentUser }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    header
                    infoCard
                    linksCard
                    dangerZone
                }
                .padding(20)
            }
            .mapleBackground()
            .navigationTitle(t.tabMe)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { LangToggle() } }
            .toast($toast)
            .task { if let id = app.currentUserID { await app.refreshUser(id: id) } }
            .onChange(of: pickerItem) { _, item in if let item { Task { await upload(item) } } }
            .confirmationDialog(t.deleteAccount, isPresented: $showDeleteConfirm, titleVisibility: .visible) {
                Button(t.deleteAccount, role: .destructive) { Task { await deleteAccount() } }
                Button(t.cancel, role: .cancel) {}
            }
        }
    }

    private var header: some View {
        VStack(spacing: 12) {
            Avatar(url: user?.avatarURL, name: user?.name ?? "?", size: 100)
            PhotosPicker(selection: $pickerItem, matching: .images) {
                Text(uploading ? "Uploading…" : (user?.avatarURL == nil ? t.addPhoto : t.changePhoto))
                    .font(.system(size: 13, weight: .medium)).foregroundStyle(MapleColor.maple)
            }
            Text(user?.name ?? "").font(.serifTitle(26)).foregroundStyle(MapleColor.ink)
        }.padding(.top, 8)
    }

    private var infoCard: some View {
        MapleCard {
            VStack(spacing: 0) {
                infoRow(t.email, user?.email ?? "")
                Divider().overlay(MapleColor.border)
                infoRow(t.gender, user?.gender ?? "—")
                Divider().overlay(MapleColor.border)
                infoRow(t.lookingFor, (user?.wantToDate ?? []).joined(separator: ", "))
                if let spots = user?.topSpots, !spots.isEmpty {
                    Divider().overlay(MapleColor.border)
                    infoRow(t.spots, spots.joined(separator: ", "))
                }
            }
        }
    }

    private var linksCard: some View {
        MapleCard {
            VStack(spacing: 0) {
                navRow(t.resources) { ResourcesView() }
                Divider().overlay(MapleColor.border)
                navRow(t.safety) { SafetyView() }
                Divider().overlay(MapleColor.border)
                navRow(t.privacy) { LegalView(kind: .privacy) }
                Divider().overlay(MapleColor.border)
                navRow(t.terms) { LegalView(kind: .terms) }
            }
        }
    }

    private var dangerZone: some View {
        VStack(spacing: 12) {
            Button(t.logout) { app.signOut() }
                .buttonStyle(MapleButtonStyle(filled: false))
            Button(t.deleteAccount) { showDeleteConfirm = true }
                .font(.system(size: 14)).foregroundStyle(MapleColor.maple)
        }
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.system(size: 15)).foregroundStyle(MapleColor.subtle)
            Spacer()
            Text(value).font(.system(size: 15, weight: .medium)).foregroundStyle(MapleColor.ink)
                .multilineTextAlignment(.trailing)
        }.padding(.vertical, 12)
    }

    private func navRow<Destination: View>(_ label: String, @ViewBuilder destination: () -> Destination) -> some View {
        NavigationLink(destination: destination()) {
            HStack {
                Text(label).font(.system(size: 16)).foregroundStyle(MapleColor.ink)
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(MapleColor.faint)
            }.padding(.vertical, 13)
        }
    }

    private func upload(_ item: PhotosPickerItem) async {
        guard let me = app.currentUserID else { return }
        uploading = true; defer { uploading = false }
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            let url = try await BackendAPI.shared.uploadAvatar(userId: me, imageData: data)
            app.currentUser?.avatarURL = url
            toast = ToastData(message: "Photo saved ✓")
        } catch {
            toast = ToastData(message: "Upload failed — try again")
        }
    }

    private func deleteAccount() async {
        guard let me = app.currentUserID else { return }
        try? await BackendAPI.shared.deleteAccount(userId: me)
        app.signOut()
    }
}
