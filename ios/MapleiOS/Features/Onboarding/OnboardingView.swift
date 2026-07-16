import SwiftUI

/// Curated 5C spots (kept in sync with the backend's plan-date list).
enum CampusSpots {
    static let all = [
        "The Motley Coffeehouse", "Honnold-Mudd Library", "The Back Abbey",
        "Walter's Restaurant", "Garner Park (Village Green)", "Rhino Records",
        "The Copper Door Coffee", "Rancho Santa Ana Garden", "The Hub at Pomona",
        "Frank Dining Hall", "Collins Dining Hall", "Pit-Stop (McConnell)",
    ]
}

struct OnboardingView: View {
    @EnvironmentObject var app: AppState
    @EnvironmentObject var lang: LangStore
    @Environment(\.dismiss) private var dismiss

    private enum Step: Int, CaseIterable { case email, code, name, gender, lookingFor, spots, password }
    @State private var step: Step = .email

    // Collected data
    @State private var email = ""
    @State private var code = ""
    @State private var name = ""
    @State private var gender = ""
    @State private var wantToDate: Set<String> = []
    @State private var spots: Set<String> = []
    @State private var password = ""

    @State private var busy = false
    @State private var error: String?

    private var t: Strings { lang.t }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Progress
            ProgressView(value: Double(step.rawValue + 1), total: Double(Step.allCases.count))
                .tint(MapleColor.maple)
                .padding(.top, 8)

            content
                .frame(maxWidth: .infinity, alignment: .leading)

            if let error {
                Text(error).font(.system(size: 14)).foregroundStyle(MapleColor.maple)
            }

            Spacer()

            Button {
                Task { await advance() }
            } label: {
                if busy { ProgressView().tint(.white) } else { Text(step == .password ? t.signUp : t.continueBtn) }
            }
            .buttonStyle(MapleButtonStyle())
            .disabled(busy || !canAdvance)
        }
        .padding(24)
        .mapleBackground()
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) { LangToggle() }
        }
    }

    @ViewBuilder private var content: some View {
        switch step {
        case .email:
            prompt(t.emailPrompt)
            MapleField(placeholder: t.emailPlaceholder, text: $email, keyboard: .emailAddress)
        case .code:
            prompt(t.codePrompt)
            MapleField(placeholder: "000000", text: $code, keyboard: .numberPad, autocap: .never)
            Button(t.codeResend) { Task { try? await BackendAPI.shared.sendEmailCode(email: email) } }
                .font(.system(size: 14)).foregroundStyle(MapleColor.subtle)
        case .name:
            prompt(t.namePrompt)
            MapleField(placeholder: t.namePlaceholder, text: $name, autocap: .words)
        case .gender:
            prompt(t.genderPrompt)
            choiceRows([("Man", t.man), ("Woman", t.woman), ("Non-binary", t.nonbinary)],
                       selected: gender) { gender = $0 }
        case .lookingFor:
            prompt(t.lookingForPrompt)
            multiChoiceRows([("Men", t.genderMan), ("Women", t.genderWoman), ("Non-binary", t.genderNonbinary)],
                            selected: wantToDate) { toggle(&wantToDate, $0) }
        case .spots:
            prompt(t.spotsPrompt)
            Text("\(spots.count)/3").font(.system(size: 13)).foregroundStyle(MapleColor.faint)
            chipGrid(CampusSpots.all, selected: spots) { spot in
                if spots.contains(spot) { spots.remove(spot) }
                else if spots.count < 3 { spots.insert(spot) }
            }
        case .password:
            prompt(t.passwordPrompt)
            MapleField(placeholder: t.passwordPlaceholder, text: $password, isSecure: true)
        }
    }

    private var canAdvance: Bool {
        switch step {
        case .email: return email.contains("@") && email.contains(".")
        case .code: return code.count == 6
        case .name: return !name.trimmingCharacters(in: .whitespaces).isEmpty
        case .gender: return !gender.isEmpty
        case .lookingFor: return !wantToDate.isEmpty
        case .spots: return true
        case .password: return password.count >= 8
        }
    }

    private func advance() async {
        error = nil
        switch step {
        case .email:
            busy = true; defer { busy = false }
            do {
                if try await BackendAPI.shared.checkEmail(email) {
                    error = "This email is already registered — log in instead."; return
                }
                try await BackendAPI.shared.sendEmailCode(email: email)
                step = .code
            } catch { self.error = error.localizedDescription }
        case .code:
            busy = true; defer { busy = false }
            do {
                try await BackendAPI.shared.verifyEmailCode(email: email, code: code)
                step = .name
            } catch { self.error = t.wrongCode }
        case .name: step = .gender
        case .gender: step = .lookingFor
        case .lookingFor: step = .spots
        case .spots: step = .password
        case .password:
            busy = true; defer { busy = false }
            do {
                let payload: [String: Any] = [
                    "email": email, "name": name, "gender": gender,
                    "want_to_date": Array(wantToDate), "top_spots": Array(spots),
                    "password": password, "campus": "Main Campus",
                ]
                let id = try await BackendAPI.shared.signup(payload)
                app.signIn(userID: id)
            } catch { self.error = error.localizedDescription }
        }
    }

    // MARK: - Small UI helpers

    private func prompt(_ text: String) -> some View {
        Text(text).font(.serifTitle(28)).foregroundStyle(MapleColor.ink)
    }

    private func toggle(_ set: inout Set<String>, _ value: String) {
        if set.contains(value) { set.remove(value) } else { set.insert(value) }
    }

    private func choiceRows(_ options: [(String, String)], selected: String, action: @escaping (String) -> Void) -> some View {
        VStack(spacing: 10) {
            ForEach(options, id: \.0) { value, label in
                selectableRow(label: label, isOn: selected == value) { action(value) }
            }
        }
    }

    private func multiChoiceRows(_ options: [(String, String)], selected: Set<String>, action: @escaping (String) -> Void) -> some View {
        VStack(spacing: 10) {
            ForEach(options, id: \.0) { value, label in
                selectableRow(label: label, isOn: selected.contains(value)) { action(value) }
            }
        }
    }

    private func selectableRow(label: String, isOn: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(label).font(.system(size: 17, weight: .medium))
                Spacer()
                if isOn { Image(systemName: "checkmark.circle.fill").foregroundStyle(MapleColor.maple) }
            }
            .padding(.horizontal, 16).padding(.vertical, 16)
            .background(isOn ? MapleColor.maple.opacity(0.08) : MapleColor.card)
            .overlay(RoundedRectangle(cornerRadius: 14)
                .strokeBorder(isOn ? MapleColor.maple : MapleColor.border, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .foregroundStyle(MapleColor.ink)
        }
    }

    private func chipGrid(_ items: [String], selected: Set<String>, action: @escaping (String) -> Void) -> some View {
        FlowLayout(spacing: 8) {
            ForEach(items, id: \.self) { item in
                let isOn = selected.contains(item)
                Button { action(item) } label: {
                    Text(item)
                        .font(.system(size: 14, weight: .medium))
                        .padding(.horizontal, 14).padding(.vertical, 9)
                        .background(isOn ? MapleColor.maple.opacity(0.12) : MapleColor.card)
                        .overlay(Capsule().strokeBorder(isOn ? MapleColor.maple : MapleColor.border, lineWidth: 1))
                        .clipShape(Capsule())
                        .foregroundStyle(isOn ? MapleColor.maple : MapleColor.ink)
                }
            }
        }
    }
}
