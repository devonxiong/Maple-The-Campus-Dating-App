import SwiftUI

struct LoginView: View {
    @EnvironmentObject var app: AppState
    @EnvironmentObject var lang: LangStore
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(lang.t.logIn)
                .font(.serifTitle(34))
                .foregroundStyle(MapleColor.ink)
                .padding(.top, 12)

            MapleField(placeholder: lang.t.emailPlaceholder, text: $email, keyboard: .emailAddress)
            MapleField(placeholder: lang.t.passwordPlaceholder, text: $password, isSecure: true)

            if let error {
                Text(error).font(.system(size: 14)).foregroundStyle(MapleColor.maple)
            }

            Button {
                Task { await submit() }
            } label: {
                if busy { ProgressView().tint(.white) } else { Text(lang.t.logIn) }
            }
            .buttonStyle(MapleButtonStyle())
            .disabled(busy || email.isEmpty || password.isEmpty)

            Spacer()
        }
        .padding(24)
        .mapleBackground()
        .navigationBarTitleDisplayMode(.inline)
    }

    private func submit() async {
        busy = true; error = nil
        defer { busy = false }
        do {
            let (id, _) = try await BackendAPI.shared.login(email: email, password: password)
            app.signIn(userID: id)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
