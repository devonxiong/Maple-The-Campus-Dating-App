import SwiftUI
import CoreLocation

struct SafetyView: View {
    @EnvironmentObject var lang: LangStore
    @StateObject private var locator = Locator()
    @State private var toast: ToastData?

    private var zh: Bool { lang.lang == .zh }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    Image(systemName: "shield.lefthalf.filled").font(.system(size: 30)).foregroundStyle(MapleColor.maple)
                    Text(zh ? "约会安全" : "Dating Safety").font(.serifTitle(28)).foregroundStyle(MapleColor.ink)
                    Text(zh ? "在公共场合见面、告诉朋友、相信直觉。需要帮助时，这里有。"
                            : "Meet in public, tell a friend, trust your gut. Here's help if you need it.")
                        .font(.system(size: 15)).foregroundStyle(MapleColor.subtle)
                }.padding(.bottom, 6)

                row("phone.fill", zh ? "求助热线" : "Help hotline",
                    zh ? "24/7 保密支持热线（988）" : "24/7 confidential support line (988)") { call("988") }
                row("building.columns.fill", zh ? "校园安保" : "Campus safety",
                    zh ? "克莱蒙特联盟校园安保" : "Claremont Colleges Campus Safety") { call("+19096072000") }
                row("flag.fill", zh ? "举报某人" : "Report someone",
                    zh ? "在对方卡片举报资料或对话" : "Flag a profile from their card") {}

                Button {
                    locator.shareLocation { link in
                        UIPasteboard.general.string = link
                        toast = ToastData(message: zh ? "链接已复制" : "Link copied")
                    }
                } label: {
                    Label(zh ? "分享我的实时位置" : "Share my live location", systemImage: "location.fill")
                }
                .buttonStyle(MapleButtonStyle())
                .padding(.top, 8)
            }
            .padding(20)
        }
        .mapleBackground()
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
    }

    private func row(_ icon: String, _ title: String, _ sub: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            MapleCard {
                HStack(spacing: 14) {
                    Image(systemName: icon).font(.system(size: 20)).foregroundStyle(MapleColor.maple).frame(width: 28)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(title).font(.system(size: 16, weight: .semibold)).foregroundStyle(MapleColor.ink)
                        Text(sub).font(.system(size: 13)).foregroundStyle(MapleColor.subtle)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(MapleColor.faint)
                }
            }
        }
    }

    private func call(_ number: String) {
        if let url = URL(string: "tel:\(number)") { UIApplication.shared.open(url) }
    }
}

/// One-shot location fetch + shareable Google Maps link (via backend, with fallback).
final class Locator: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var completion: ((String) -> Void)?

    func shareLocation(_ completion: @escaping (String) -> Void) {
        self.completion = completion
        manager.delegate = self
        manager.requestWhenInUseAuthorization()
        manager.requestLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.first else { return }
        let lat = loc.coordinate.latitude, lng = loc.coordinate.longitude
        let fallback = "https://maps.google.com/?q=\(lat),\(lng)"
        completion?(fallback)
        completion = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        completion = nil
    }
}
