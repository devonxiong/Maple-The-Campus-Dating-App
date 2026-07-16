import SwiftUI
import Combine

enum Lang: String { case en, zh }

/// Observable language selection, persisted like the web app's `maple_lang`.
final class LangStore: ObservableObject {
    @AppStorage("maple_lang") private var stored: String = "en"
    @Published var lang: Lang = .en

    init() { lang = Lang(rawValue: stored) ?? .en }

    func toggle() {
        lang = (lang == .en) ? .zh : .en
        stored = lang.rawValue
        objectWillChange.send()
    }

    var t: Strings { lang == .zh ? .zh : .en }
    func school(_ s: String) -> String { lang == .zh ? Strings.localizeSchool(s) : s }
}

/// Localized copy. Mirrors lib/i18n.ts (curated to what the iOS screens use).
struct Strings {
    // General / landing / onboarding
    let tagline, appName: String
    let getStarted, logIn, signUp, continueBtn, back, next, cancel, done, save, loading: String
    let emailPrompt, emailPlaceholder, codePrompt, codeResend, wrongCode: String
    let namePrompt, namePlaceholder, genderPrompt, lookingForPrompt, spotsPrompt, passwordPrompt, passwordPlaceholder: String
    let man, woman, nonbinary: String
    let genderMan, genderWoman, genderNonbinary: String
    // Tabs
    let tabFeed, tabMatches, tabMe: String
    // Feed
    let feedTagline, cardPass, cardShoot, report, block, nearby, uKnowThem: String
    let seenEveryone, seenEveryoneSub, openBox, blindCard: String
    let tShotSent, tGone30, tBlocked: String
    // Match
    let revealTitle, revealSub, letAiCook, cookingTitle, cookingSub, dateCooked: String
    let whenLabel, whereLabel, inCommon, convStarter, openMaps, imInGo, nah, backFeed: String
    // Matches list
    let matchesTitle, matchesEmpty: String
    // Profile
    let email, gender, lookingFor, spots, logout, editProfile, deleteAccount, resources, safety, privacy, terms: String
    let addPhoto, changePhoto: String

    static func localizeSchool(_ school: String) -> String {
        let map = [
            "Pomona": "波莫纳学院", "CMC": "克莱蒙特麦肯纳学院", "HMC": "哈维马德学院",
            "Scripps": "斯克里普斯学院", "Pitzer": "匹泽学院", "Claremont Colleges": "克莱蒙特联盟",
        ]
        return map[school] ?? school
    }

    static let en = Strings(
        tagline: "For the one you've seen a thousand times.", appName: "Maple",
        getStarted: "get started", logIn: "log in", signUp: "sign up", continueBtn: "continue →",
        back: "← back", next: "next →", cancel: "cancel", done: "done", save: "save", loading: "Loading…",
        emailPrompt: "What's your school email?", emailPlaceholder: "you@school.edu",
        codePrompt: "Enter the 6-digit code we emailed you", codeResend: "resend code", wrongCode: "Wrong code — try again",
        namePrompt: "What should people call you?", namePlaceholder: "your name",
        genderPrompt: "I am a…", lookingForPrompt: "I'm looking to date…",
        spotsPrompt: "Where do you hang out on campus?", passwordPrompt: "Set a password",
        passwordPlaceholder: "at least 8 characters",
        man: "Man", woman: "Woman", nonbinary: "Non-binary",
        genderMan: "Men", genderWoman: "Women", genderNonbinary: "Non-binary",
        tabFeed: "Feed", tabMatches: "Matches", tabMe: "Me",
        feedTagline: "shoot your shot — only they'll know", cardPass: "not for me", cardShoot: "🍁 shoot your shot",
        report: "⚠️ report", block: "🚫 block", nearby: "📍 nearby", uKnowThem: "u know them 👀",
        seenEveryone: "That's everyone near you for now",
        seenEveryoneSub: "you've gone through the whole pool. new people join every week — check back soon.",
        openBox: "open the box 🎁", blindCard: "blind date 🎁",
        tShotSent: "❤️ shot sent", tGone30: "👋 gone for 30 days", tBlocked: "🚫 blocked — they're gone for good",
        revealTitle: "it's giving mutual 🍁", revealSub: "you both shot your shot. respect.",
        letAiCook: "let AI cook the date →", cookingTitle: "AI is literally cooking rn",
        cookingSub: "planning something just for you two ✨", dateCooked: "the date is cooked. 🍁",
        whenLabel: "When", whereLabel: "Where", inCommon: "What you have in common", convStarter: "Conversation starter",
        openMaps: "open in maps →", imInGo: "i'm in, let's go ✓", nah: "nah not feeling it", backFeed: "back to the feed",
        matchesTitle: "your matches", matchesEmpty: "no matches yet — go shoot your shot 🍁",
        email: "Email", gender: "Gender", lookingFor: "Looking for", spots: "Spots", logout: "log out",
        editProfile: "edit profile", deleteAccount: "delete account", resources: "Resources", safety: "Safety",
        privacy: "Privacy Policy", terms: "Terms of Service", addPhoto: "Add a photo", changePhoto: "Change photo"
    )

    static let zh = Strings(
        tagline: "为你见过千百次的那个人。", appName: "Maple",
        getStarted: "开始", logIn: "登录", signUp: "注册", continueBtn: "继续 →",
        back: "← 返回", next: "下一步 →", cancel: "取消", done: "完成", save: "保存", loading: "加载中…",
        emailPrompt: "你的学校邮箱是？", emailPlaceholder: "you@school.edu",
        codePrompt: "输入我们邮件发给你的 6 位验证码", codeResend: "重新发送", wrongCode: "验证码错误 — 请重试",
        namePrompt: "大家怎么称呼你？", namePlaceholder: "你的名字",
        genderPrompt: "我是…", lookingForPrompt: "我想认识…",
        spotsPrompt: "你在校园里常去哪儿？", passwordPrompt: "设置一个密码",
        passwordPlaceholder: "至少 8 个字符",
        man: "男生", woman: "女生", nonbinary: "非二元",
        genderMan: "男生", genderWoman: "女生", genderNonbinary: "非二元",
        tabFeed: "发现", tabMatches: "匹配", tabMe: "我",
        feedTagline: "勇敢表白 — 只有对方知道", cardPass: "不合适", cardShoot: "🍁 勇敢表白",
        report: "⚠️ 举报", block: "🚫 拉黑", nearby: "📍 附近", uKnowThem: "你认识他 👀",
        seenEveryone: "附近的人暂时看完了",
        seenEveryoneSub: "你已经把整个池子都看了一遍。每周都有新人加入 — 过会儿再来看看。",
        openBox: "打开盲盒 🎁", blindCard: "盲盒约会 🎁",
        tShotSent: "❤️ 已表白", tGone30: "👋 暂别 30 天", tBlocked: "🚫 已拉黑 — 永久看不到了",
        revealTitle: "双向奔赴 🍁", revealSub: "你们都勇敢表白了，respect。",
        letAiCook: "让 AI 安排约会 →", cookingTitle: "AI 正在火力全开",
        cookingSub: "正在为你俩量身规划 ✨", dateCooked: "约会安排好了。🍁",
        whenLabel: "时间", whereLabel: "地点", inCommon: "你们的共同点", convStarter: "破冰话题",
        openMaps: "在地图中打开 →", imInGo: "我可以，走起 ✓", nah: "算了，没感觉", backFeed: "返回 feed",
        matchesTitle: "你的匹配", matchesEmpty: "还没有匹配 — 去勇敢表白吧 🍁",
        email: "邮箱", gender: "性别", lookingFor: "想认识", spots: "常去地点", logout: "退出登录",
        editProfile: "编辑资料", deleteAccount: "删除账号", resources: "资源", safety: "安全",
        privacy: "隐私政策", terms: "服务条款", addPhoto: "加一张照片", changePhoto: "换一张照片"
    )
}
