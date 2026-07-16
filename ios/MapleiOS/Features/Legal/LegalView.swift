import SwiftUI

struct LegalSection: Identifiable {
    let id = UUID()
    let heading: String
    let body: String
    var list: [String] = []
}

struct LegalView: View {
    enum Kind { case privacy, terms }
    let kind: Kind
    @EnvironmentObject var lang: LangStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text(title).font(.serifTitle(30)).foregroundStyle(MapleColor.ink)
                Text(updated).font(.system(size: 13)).foregroundStyle(MapleColor.faint)
                ForEach(sections) { s in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(s.heading).font(.system(size: 17, weight: .semibold)).foregroundStyle(MapleColor.ink)
                        if !s.body.isEmpty {
                            Text(s.body).font(.system(size: 15)).foregroundStyle(MapleColor.subtle)
                        }
                        ForEach(s.list, id: \.self) { item in
                            HStack(alignment: .top, spacing: 8) {
                                Text("•").foregroundStyle(MapleColor.maple)
                                Text(item).font(.system(size: 15)).foregroundStyle(MapleColor.subtle)
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .mapleBackground()
        .navigationBarTitleDisplayMode(.inline)
    }

    private var isZH: Bool { lang.lang == .zh }
    private var title: String {
        kind == .privacy ? (isZH ? "隐私政策" : "Privacy Policy") : (isZH ? "服务条款" : "Terms of Service")
    }
    private var updated: String { isZH ? "最近更新：2026 年 4 月 30 日" : "Last updated: April 30, 2026" }

    private var sections: [LegalSection] {
        switch (kind, isZH) {
        case (.privacy, false):
            return [
                .init(heading: "1. Who We Are", body: "Maple is a campus dating app exclusively for students at the Claremont Colleges (Pitzer, Pomona, Scripps, Claremont McKenna, and Harvey Mudd), operated by Maple Inc. Reach us at hello@maplemeet.ai."),
                .init(heading: "2. Information We Collect", body: "", list: ["Account info: name, school email, gender, dating preferences, phone number.", "Location: approximate GPS, only to suggest nearby date venues. Never stored long-term.", "Usage data: swipes and match interactions, to power matching."]),
                .init(heading: "3. How We Use Your Information", body: "", list: ["Show you compatible matches on campus.", "Send match notifications via SMS.", "Plan date suggestions using your approximate location.", "Verify you're a current 5C student."]),
                .init(heading: "4. Information Sharing", body: "We do not sell your personal data. We share only with Supabase (database), Twilio (SMS), Google (Maps), and Anthropic (AI date planning — no personal identifiers sent)."),
                .init(heading: "5. Data Retention", body: "Account data is retained while your account exists. Delete anytime by emailing hello@maplemeet.ai. Location data isn't stored beyond each session."),
                .init(heading: "6. Security", body: "We use HTTPS and row-level security. Phone numbers are used only for verification and match notifications."),
                .init(heading: "7. Your Rights", body: "Request access, correction, or deletion anytime at hello@maplemeet.ai."),
                .init(heading: "8. Contact", body: "Questions? Email hello@maplemeet.ai."),
            ]
        case (.privacy, true):
            return [
                .init(heading: "1. 我们是谁", body: "Maple 是一款仅面向克莱蒙特联盟院校（Pitzer、Pomona、Scripps、CMC、Harvey Mudd）学生的校园约会应用，由 Maple Inc. 运营。联系方式：hello@maplemeet.ai。"),
                .init(heading: "2. 我们收集的信息", body: "", list: ["账号信息：姓名、学校邮箱、性别、约会偏好、手机号。", "位置：大致 GPS，仅用于推荐附近约会地点，不会长期存储。", "使用数据：滑动与匹配互动，用于支撑匹配。"]),
                .init(heading: "3. 我们如何使用", body: "", list: ["为你展示校园里合适的匹配。", "通过短信发送匹配通知。", "基于大致位置规划约会建议。", "验证你是在校 5C 学生。"]),
                .init(heading: "4. 信息共享", body: "我们不出售你的个人数据，仅与 Supabase（数据库）、Twilio（短信）、Google（地图）、Anthropic（AI 约会规划，不发送个人身份信息）共享。"),
                .init(heading: "5. 数据保留", body: "账号存在期间保留账号数据。可随时发邮件至 hello@maplemeet.ai 删除。位置数据不在单次会话外存储。"),
                .init(heading: "6. 安全", body: "我们采用 HTTPS 和行级安全。手机号仅用于验证与匹配通知。"),
                .init(heading: "7. 你的权利", body: "可随时通过 hello@maplemeet.ai 要求访问、更正或删除个人数据。"),
                .init(heading: "8. 联系我们", body: "有问题？发邮件至 hello@maplemeet.ai。"),
            ]
        case (.terms, false):
            return [
                .init(heading: "1. Eligibility", body: "Maple is exclusively for current Claremont Colleges students. You must be at least 18 and have a valid 5C student email."),
                .init(heading: "2. Your Account", body: "You're responsible for your account's accuracy. Don't create an account for someone else or use an email you don't own. One account per person."),
                .init(heading: "3. Acceptable Use", body: "You agree not to:", list: ["Harass, threaten, or harm other users.", "Use Maple for commercial purposes.", "Reverse-engineer or abuse the platform.", "Create fake accounts or misrepresent your identity.", "Share another user's info without consent."]),
                .init(heading: "4. Matches and Interactions", body: "Maple shows you other students anonymously until a mutual match. We don't guarantee any number of matches or outcomes."),
                .init(heading: "5. AI-Planned Dates", body: "Date suggestions are provided for convenience only and aren't guarantees of availability, safety, or suitability."),
                .init(heading: "6. Termination", body: "We may suspend or terminate accounts that violate these terms. Delete yours anytime at hello@maplemeet.ai."),
                .init(heading: "7. Disclaimer", body: "Maple is provided \"as is.\" Use good judgment and stay safe."),
                .init(heading: "8. Contact", body: "Questions? Email hello@maplemeet.ai."),
            ]
        case (.terms, true):
            return [
                .init(heading: "1. 资格", body: "Maple 仅面向克莱蒙特联盟在校学生。你必须年满 18 岁并拥有有效的 5C 学生邮箱。"),
                .init(heading: "2. 你的账号", body: "你有责任保持账号信息准确。不得代替他人创建账号或使用不属于你的邮箱。每人仅限一个账号。"),
                .init(heading: "3. 可接受的使用", body: "你同意不会：", list: ["骚扰、威胁或伤害其他用户。", "将 Maple 用于商业目的。", "逆向工程或滥用平台。", "创建虚假账号或冒充身份。", "未经同意分享他人信息。"]),
                .init(heading: "4. 匹配与互动", body: "双向匹配前，Maple 匿名展示其他学生。我们不保证匹配数量或结果。"),
                .init(heading: "5. AI 规划的约会", body: "约会建议仅为方便提供，不保证可用性、安全性或合适性。"),
                .init(heading: "6. 终止", body: "对于违规账号，我们保留暂停或终止的权利。可随时通过 hello@maplemeet.ai 删除账号。"),
                .init(heading: "7. 免责声明", body: "Maple 按\"现状\"提供。请审慎判断、注意安全。"),
                .init(heading: "8. 联系我们", body: "有问题？发邮件至 hello@maplemeet.ai。"),
            ]
        }
    }
}
