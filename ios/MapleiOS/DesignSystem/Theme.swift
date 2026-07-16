import SwiftUI

/// Maple's warm, editorial palette — mirrors the web app's cream + ink look.
enum MapleColor {
    static let cream = Color(red: 0.973, green: 0.969, blue: 0.957)   // #f8f7f4
    static let card = Color.white
    static let ink = Color(red: 0.067, green: 0.067, blue: 0.067)     // #111
    static let subtle = Color(red: 0.42, green: 0.40, blue: 0.38)     // #6b6760
    static let faint = Color(red: 0.61, green: 0.58, blue: 0.56)      // #9b9590
    static let border = Color(red: 0.91, green: 0.90, blue: 0.88)     // #e8e6e1
    static let maple = Color(red: 0.85, green: 0.27, blue: 0.15)      // maple red/orange
    static let leaf = Color(red: 0.80, green: 0.42, blue: 0.16)
}

extension Font {
    static func serifTitle(_ size: CGFloat) -> Font {
        .system(size: size, weight: .bold, design: .serif)
    }
}

/// Primary pill button used across the app.
struct MapleButtonStyle: ButtonStyle {
    var filled: Bool = true
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(filled ? MapleColor.ink : Color.clear)
            .foregroundStyle(filled ? Color.white : MapleColor.ink)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .strokeBorder(MapleColor.ink.opacity(filled ? 0 : 0.25), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .opacity(configuration.isPressed ? 0.7 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

/// A rounded card surface.
struct MapleCard<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(18)
            .background(MapleColor.card)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .strokeBorder(MapleColor.border, lineWidth: 1)
            )
    }
}

extension View {
    /// Full-screen cream background.
    func mapleBackground() -> some View {
        self.background(MapleColor.cream.ignoresSafeArea())
    }
}

/// Small maple-leaf mark (SF Symbol stand-in for the logo).
struct MapleMark: View {
    var size: CGFloat = 28
    var body: some View {
        Text("🍁").font(.system(size: size))
    }
}
