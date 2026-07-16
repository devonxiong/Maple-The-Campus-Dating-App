import SwiftUI

/// Circular avatar that loads a remote image or falls back to an initial.
struct Avatar: View {
    let url: String?
    let name: String
    var size: CGFloat = 56

    var body: some View {
        Group {
            if let url, let u = URL(string: url) {
                AsyncImage(url: u) { phase in
                    switch phase {
                    case .success(let img): img.resizable().scaledToFill()
                    default: placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(Circle().strokeBorder(MapleColor.border, lineWidth: 1))
    }

    private var placeholder: some View {
        ZStack {
            LinearGradient(colors: [MapleColor.maple.opacity(0.8), MapleColor.leaf.opacity(0.7)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            Text(String(name.prefix(1)).uppercased())
                .font(.system(size: size * 0.42, weight: .bold))
                .foregroundStyle(.white)
        }
    }
}

/// Language toggle chip (EN ⇄ 中文).
struct LangToggle: View {
    @EnvironmentObject var lang: LangStore
    var body: some View {
        Button { lang.toggle() } label: {
            Text(lang.lang == .en ? "中文" : "EN")
                .font(.system(size: 13, weight: .semibold))
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(MapleColor.card)
                .overlay(Capsule().strokeBorder(MapleColor.border, lineWidth: 1))
                .clipShape(Capsule())
                .foregroundStyle(MapleColor.subtle)
        }
    }
}

/// Lightweight toast overlay.
struct ToastData: Equatable { var message: String; var id = UUID() }

struct ToastModifier: ViewModifier {
    @Binding var toast: ToastData?
    func body(content: Content) -> some View {
        content.overlay(alignment: .top) {
            if let toast {
                Text(toast.message)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18).padding(.vertical, 12)
                    .background(MapleColor.ink.opacity(0.92))
                    .clipShape(Capsule())
                    .padding(.top, 12)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .task(id: toast.id) {
                        try? await Task.sleep(for: .seconds(2))
                        withAnimation { self.toast = nil }
                    }
            }
        }
        .animation(.spring(duration: 0.3), value: toast)
    }
}

extension View {
    func toast(_ toast: Binding<ToastData?>) -> some View { modifier(ToastModifier(toast: toast)) }
}

/// Rounded text field used in onboarding/login.
struct MapleField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure = false
    var keyboard: UIKeyboardType = .default
    var autocap: TextInputAutocapitalization = .never

    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .textInputAutocapitalization(autocap)
        .autocorrectionDisabled()
        .keyboardType(keyboard)
        .font(.system(size: 17))
        .padding(.horizontal, 16).padding(.vertical, 15)
        .background(MapleColor.card)
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(MapleColor.border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
