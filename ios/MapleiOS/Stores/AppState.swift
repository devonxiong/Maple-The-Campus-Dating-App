import SwiftUI

/// Root auth/session store. Mirrors the web app's localStorage `maple_uid`.
@MainActor
final class AppState: ObservableObject {
    @AppStorage("maple_uid") private var storedUID: String = ""

    @Published var currentUserID: String?
    @Published var currentUser: MapleUser?
    @Published var isLoading = false

    var isSignedIn: Bool { currentUserID != nil }

    init() {
        if !storedUID.isEmpty { currentUserID = storedUID }
    }

    func bootstrap() async {
        guard let id = currentUserID else { return }
        await refreshUser(id: id)
        // If the account no longer exists, sign out.
        if currentUser == nil { signOut() }
    }

    func signIn(userID: String) {
        storedUID = userID
        currentUserID = userID
        Task { await refreshUser(id: userID) }
    }

    func signOut() {
        storedUID = ""
        currentUserID = nil
        currentUser = nil
    }

    func refreshUser(id: String) async {
        do {
            let rows = try await SupabaseREST.shared.select(
                "users",
                filters: [URLQueryItem(name: "id", value: "eq.\(id)")],
                limit: 1,
                as: [MapleUser].self
            )
            currentUser = rows.first
        } catch {
            print("[AppState] refreshUser error: \(error)")
        }
    }
}
