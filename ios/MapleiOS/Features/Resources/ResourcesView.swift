import SwiftUI

struct ResourcesView: View {
    @EnvironmentObject var lang: LangStore
    private var zh: Bool { lang.lang == .zh }

    private struct Tile: Identifiable {
        let id = UUID()
        let en, zh, icon, href: String
        let color: Color
    }

    private var tiles: [Tile] {
        [
            .init(en: "Mental Health", zh: "心理健康", icon: "brain.head.profile", href: "https://services.claremont.edu/mcaps/", color: Color(red: 0.95, green: 0.78, blue: 0.27)),
            .init(en: "Safe Sex", zh: "安全性行为", icon: "lifepreserver", href: "https://www.plannedparenthood.org/learn/birth-control", color: Color(red: 0.37, green: 0.71, blue: 0.90)),
            .init(en: "Consent", zh: "关于同意", icon: "hands.sparkles", href: "https://www.rainn.org/articles/what-is-consent", color: Color(red: 0.56, green: 0.79, blue: 0.56)),
            .init(en: "Substances", zh: "药物与安全", icon: "cup.and.saucer", href: "https://www.samhsa.gov/find-help/national-helpline", color: Color(red: 0.91, green: 0.66, blue: 0.41)),
            .init(en: "Everything else", zh: "更多资源", icon: "sparkles", href: "https://services.claremont.edu/empower/", color: Color(red: 0.92, green: 0.85, blue: 0.54)),
        ]
    }

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(zh ? "约会资源" : "Dating Resources").font(.serifTitle(28)).foregroundStyle(MapleColor.ink)
                    Text(zh ? "你的知识库 —— 没人告诉你的那些事，都在一处。"
                            : "Your knowledge hub — the stuff no one tells you, in one place.")
                        .font(.system(size: 15)).foregroundStyle(MapleColor.subtle)
                }

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(tiles) { tile in
                        Link(destination: URL(string: tile.href)!) {
                            VStack(alignment: .leading, spacing: 10) {
                                Image(systemName: tile.icon).font(.system(size: 22))
                                Spacer()
                                Text(zh ? tile.zh : tile.en).font(.system(size: 16, weight: .semibold))
                            }
                            .frame(maxWidth: .infinity, minHeight: 110, alignment: .leading)
                            .padding(16)
                            .foregroundStyle(Color(red: 0.15, green: 0.13, blue: 0.06))
                            .background(tile.color)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                        }
                    }
                }
            }
            .padding(20)
        }
        .mapleBackground()
        .navigationBarTitleDisplayMode(.inline)
    }
}
