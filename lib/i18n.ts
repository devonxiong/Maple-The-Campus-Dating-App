// Shared language helpers + dictionaries.
import { useEffect, useState } from 'react'

export type Lang = 'en' | 'zh'

export function readLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const v = localStorage.getItem('maple_lang')
  return v === 'zh' ? 'zh' : 'en'
}

export function writeLang(lang: Lang) {
  if (typeof window !== 'undefined') localStorage.setItem('maple_lang', lang)
}

// Localize a school name (from schoolFromEmail) for display.
export function localizeSchool(school: string, lang: Lang): string {
  if (lang !== 'zh') return school
  const map: Record<string, string> = { 'Tsinghua University': '清华大学' }
  return map[school] ?? school
}

// Hook: read saved language on mount + a toggle that persists.
export function useLang(): [Lang, () => void] {
  const [lang, setLang] = useState<Lang>('en')
  useEffect(() => { setLang(readLang()) }, [])
  const toggle = () => setLang(prev => {
    const next: Lang = prev === 'en' ? 'zh' : 'en'
    writeLang(next)
    return next
  })
  return [lang, toggle]
}

// Feed / post-login strings.
export const FEED = {
  en: {
    tagline: "For the one you've seen a thousand times.",
    loading: 'Loading…',
    checkingKnown: 'checking who you know…',
    // action legend
    legShoot: 'shoot your shot', legShootSub: "only they'll know",
    legPass: 'not for me', legPassSub: '30-day break',
    legBlock: 'block — forever',
    // incoming blind date
    blindReqTitle: 'You have a blind date request',
    blindReqDesc: "Someone from your campus wants to meet you — anonymously. Say yes and you'll both find out who each other is.",
    notThisTime: 'not this time', imIn: "I'm in 🎁",
    // second chance
    secondChance: 'showing people you passed on before — maybe give them another look?',
    // sections
    knownTitle: '👋 people you actually know', knownSub: '— already on Maple',
    maybeTitle: '✦ might know them', maybeSub: '— same campus, just sayin',
    inviteTitle: '✉️ get your friends in on this', inviteSub: "— they're missing out fr",
    sent: 'sent ✓', invite: 'invite 🍁',
    // blind date card
    blindCard: 'blind date 🎁',
    blindWaiting: "Waiting for them to open their end… they'll get a mystery request.",
    blindPending: 'pending their response',
    blindDesc: "We pick someone from your campus — could be a new face or someone you've passed. They decide too. Both say yes → you meet.",
    openBox: 'open the box 🎁',
    // direct invite
    inviteSomeone: '✉️ invite someone', inviteSomeoneSub: '— send them a link',
    inviteBody: "Know someone who should be on here? Drop their .edu email and we'll send them an invite.",
    invitePh: 'their@school.edu', send: 'send 🍁',
    // empty state
    seenEveryone: "you've seen everyone 👀",
    seenEveryoneSub: "you've gone through the whole pool. new people join every week — check back soon.",
    whileYouWait: 'while you wait…',
    waitTip1: 'invite your friends — the more people here, the better your odds',
    waitTip2: 'passes expire after 30 days — some people will come back around',
    seeAgain: 'see them again 🔁',
    poolRefresh: 'new pool refreshes weekly · last updated Friday',
    // blind consent modal
    consentB1pre: 'We pick ', consentB1bold: 'one person', consentB1post: " from your campus at random — could be someone new, or someone you've passed before.",
    consentB2pre: 'They get a mystery request. ', consentB2bold: 'They have to say yes too.', consentB2post: ' No pressure on either side.',
    consentB3: "If both of you say yes — it's a match. AI picks a spot and time for you.",
    letsGo: "let's go 🎁", maybeLater: 'maybe later',
    // report modal
    reportTitle: 'Report this person',
    reportBody: "They'll be blocked immediately. We review every report within 24 hours.",
    rInappropriate: 'Inappropriate messages', rFake: 'Fake profile', rHarass: 'Harassment', rSpam: 'Spam', rOther: 'Other',
    submitReport: 'Submit report',
    // settings modal
    privacy: 'Privacy Settings',
    locTrack: '📍 Location tracking', locTrackSub: 'Lets AI suggest meetup spots near you both. Turn off to go invisible.',
    aiPlan: '🤖 AI date planning', aiPlanSub: 'AI picks a venue and time when you both match. Turn off to plan it yourself.',
    topSpots: '📍 Your top spots', topSpotsSub: 'Pick up to 3 places you hang out — helps AI suggest where to meet.',
    selectedSuffix: 'selected · tap to deselect',
    goProfile: 'go to my profile →', logout: 'log out',
    // cards
    uKnowThem: 'u know them 👀', nearby: '📍 nearby',
    cardPass: 'not for me', cardShoot: '🍁 shoot your shot', report: '⚠️ report', block: '🚫 block',
    // toasts
    tSettingsSaved: 'Settings saved ✓',
    tBlindIncoming: '🎁 Someone sent you a blind date request!',
    tBlindYes: '🎁 They said yes!',
    tBlindPassed: '🎁 They passed this time — try again?',
    tNearbyLikes: 'Someone nearby likes you 🍁',
    tFailContacts: 'Failed to read contacts',
    tGoogleNot: 'Google not configured', tGoogleLoad: 'Loading Google… try again', tGoogleCancel: 'Google sign-in cancelled',
    tOops: 'Something went wrong.',
    tShotSent: '❤️ shot sent', tGone30: '👋 gone for 30 days', tBlocked: "🚫 blocked — they're gone for good",
    tFailInvite: 'Failed to send invite',
    tNoOne: 'No one available right now — try later', tAlreadyWaiting: 'You already have one waiting 🎁',
    tBlindSent: '🎁 Sent! Waiting for them…', tCouldNotSend: 'Could not send — try again',
    tOnYourWay: '🎁 On your way!', tMaybeNext: 'Maybe next time',
    tReported: 'reported & blocked', tOops2: 'something went wrong',
    tNeedEdu: 'needs to be a .edu email', tAlreadyInvited: 'already invited!', tFailInvite2: 'failed to send invite',
    tInvited: (name: string) => `✉️ Invited ${name}`,
    tInviteSentTo: (who: string) => `✉️ invite sent to ${who}`,
  },
  zh: {
    tagline: '为你见过千百次的那个人。',
    loading: '加载中…',
    checkingKnown: '正在查找你认识的人…',
    legShoot: '勇敢表白', legShootSub: '只有对方知道',
    legPass: '不合适', legPassSub: '暂别 30 天',
    legBlock: '拉黑 — 永久',
    blindReqTitle: '你收到一个盲盒约会邀请',
    blindReqDesc: '同校的某个人想匿名认识你。点同意，你们就会同时知道彼此是谁。',
    notThisTime: '下次吧', imIn: '我加入 🎁',
    secondChance: '在给你看之前划过的人 — 要不要再看一眼？',
    knownTitle: '👋 你真正认识的人', knownSub: '— 已在 Maple',
    maybeTitle: '✦ 你可能认识', maybeSub: '— 同校，随便说说',
    inviteTitle: '✉️ 拉你的朋友进来', inviteSub: '— 他们错过太多了',
    sent: '已发送 ✓', invite: '邀请 🍁',
    blindCard: '盲盒约会 🎁',
    blindWaiting: '等对方打开他们那一端… 他们会收到一个神秘邀请。',
    blindPending: '等待对方回应',
    blindDesc: '我们从你的校园里挑一个人 — 可能是新面孔，也可能是你划过的人。对方也要决定。双方都同意 → 你们见面。',
    openBox: '打开盲盒 🎁',
    inviteSomeone: '✉️ 邀请某人', inviteSomeoneSub: '— 发给他一个链接',
    inviteBody: '认识谁应该来这儿？填他的 .edu 邮箱，我们帮你发邀请。',
    invitePh: 'their@school.edu', send: '发送 🍁',
    seenEveryone: '你已经看完所有人了 👀',
    seenEveryoneSub: '你已经把整个池子都看了一遍。每周都有新人加入 — 过会儿再来看看。',
    whileYouWait: '等待的时候…',
    waitTip1: '邀请你的朋友 — 这里人越多，你的机会越大',
    waitTip2: '划过的人 30 天后过期 — 有些人会再出现',
    seeAgain: '再看一遍 🔁',
    poolRefresh: '池子每周刷新 · 上次更新于周五',
    consentB1pre: '我们从你的校园里随机挑 ', consentB1bold: '一个人', consentB1post: ' — 可能是新人，也可能是你之前划过的人。',
    consentB2pre: '对方会收到一个神秘邀请。', consentB2bold: '他们也必须同意。', consentB2post: ' 双方都没有压力。',
    consentB3: '如果你俩都同意 — 就匹配成功。AI 会帮你们选好地点和时间。',
    letsGo: '开始吧 🎁', maybeLater: '以后再说',
    reportTitle: '举报这个人',
    reportBody: '对方会被立即拉黑。我们会在 24 小时内审核每一条举报。',
    rInappropriate: '不当信息', rFake: '虚假资料', rHarass: '骚扰', rSpam: '垃圾信息', rOther: '其他',
    submitReport: '提交举报',
    privacy: '隐私设置',
    locTrack: '📍 位置追踪', locTrackSub: '让 AI 推荐你们附近的见面地点。关闭则进入隐身。',
    aiPlan: '🤖 AI 约会规划', aiPlanSub: '匹配成功后由 AI 选好地点和时间。关闭则自己安排。',
    topSpots: '📍 你常去的地点', topSpotsSub: '最多选 3 个你常待的地方 — 帮 AI 推荐见面地点。',
    selectedSuffix: '已选 · 点按取消',
    goProfile: '去我的主页 →', logout: '退出登录',
    uKnowThem: '你认识他 👀', nearby: '📍 附近',
    cardPass: '不合适', cardShoot: '🍁 勇敢表白', report: '⚠️ 举报', block: '🚫 拉黑',
    tSettingsSaved: '设置已保存 ✓',
    tBlindIncoming: '🎁 有人给你发了盲盒约会邀请！',
    tBlindYes: '🎁 对方同意了！',
    tBlindPassed: '🎁 对方这次划过了 — 再试一次？',
    tNearbyLikes: '附近有人喜欢你 🍁',
    tFailContacts: '读取联系人失败',
    tGoogleNot: 'Google 未配置', tGoogleLoad: '正在加载 Google… 请重试', tGoogleCancel: '已取消 Google 登录',
    tOops: '出错了。',
    tShotSent: '❤️ 已表白', tGone30: '👋 暂别 30 天', tBlocked: '🚫 已拉黑 — 永久看不到了',
    tFailInvite: '邀请发送失败',
    tNoOne: '暂时没有可约的人 — 晚点再试', tAlreadyWaiting: '你已经有一个在等待中 🎁',
    tBlindSent: '🎁 已发送！等待对方…', tCouldNotSend: '发送失败 — 请重试',
    tOnYourWay: '🎁 出发吧！', tMaybeNext: '下次再约',
    tReported: '已举报并拉黑', tOops2: '出错了',
    tNeedEdu: '需要 .edu 邮箱', tAlreadyInvited: '已经邀请过了！', tFailInvite2: '邀请发送失败',
    tInvited: (name: string) => `✉️ 已邀请 ${name}`,
    tInviteSentTo: (who: string) => `✉️ 已向 ${who} 发送邀请`,
  },
}

export type FeedT = typeof FEED.en

// ─── Profile page ─────────────────────────────────────────────────────────────
export const PROFILE = {
  en: {
    back: '← back',
    setupTitle: 'One last thing 👋', setupSub: "add a photo so people know it's you",
    uploading: 'Uploading…', changePhoto: 'Change photo 📷', addPhoto: 'Add a photo 📷',
    looksGood: 'looks good, continue →', skip: 'skip for now',
    email: 'Email', gender: 'Gender', lookingFor: 'Looking for', spots: 'Spots', logout: 'log out',
    tSelectImage: 'Please select an image', tTooLarge: 'Photo too large — max 5MB',
    tUploadFail: 'Upload failed — try again', tSaved: 'Photo saved ✓',
  },
  zh: {
    back: '← 返回',
    setupTitle: '最后一步 👋', setupSub: '加一张照片，让大家认出你',
    uploading: '上传中…', changePhoto: '换一张照片 📷', addPhoto: '加一张照片 📷',
    looksGood: '不错，继续 →', skip: '暂时跳过',
    email: '邮箱', gender: '性别', lookingFor: '想认识', spots: '常去地点', logout: '退出登录',
    tSelectImage: '请选择一张图片', tTooLarge: '图片太大 — 最大 5MB',
    tUploadFail: '上传失败 — 请重试', tSaved: '照片已保存 ✓',
  },
}

// ─── Match page ───────────────────────────────────────────────────────────────
export const MATCH = {
  en: {
    revealTitle: "it's giving mutual 🍁", revealSub: 'you both shot your shot. respect.',
    yourPerson: 'your person 🫶', letAiCook: 'let AI cook the date →', sameTime: 'they found out at the exact same time 👀',
    step1: 'Match detected', step2: 'Fetching profiles', step3: 'Reading calendars & parsing schedules',
    step4: 'Finding best venue', step5: 'Generating date plan', step6: 'Sending confirmation',
    cookingTitle: 'AI is literally cooking rn', cookingSub: 'planning something just for you two ✨',
    now: 'now', giveItSec: "give it ~10 seconds, we're not doing this mid 💅",
    dateCooked: 'the date is cooked. 🍁', personalized: 'personalized to both your schedules, no cap.',
    when: 'When', where: 'Where', walkEach: (n: number) => `~${n} min walk each`, openMaps: 'open in maps →',
    inCommon: 'What you have in common', convStarter: 'Conversation starter',
    imIn: "i'm in, let's go ✓", nah: 'nah not feeling it', ghost: "ghost 3x and you're benched for a week 💀",
    happening: "it's happening bestie 🎉", bothConfirmed: "both of you confirmed. don't be late 😤",
    stayConnected: (name: string) => `stay connected with ${name} 📱`, saveNumber: 'save their number or hit them up directly',
    addContact: (name: string) => `Add ${name} to contacts`,
    wantDirections: 'want directions? 🗺️', navigateTo: (v: string) => `navigate to ${v}`, backFeed: 'back to the feed',
    stillCooking: 'AI is still cooking… give it a sec 🍳', checkAgain: 'Check again',
    cancelled3: "You've cancelled 3 dates. Your account is paused for 1 week.",
  },
  zh: {
    revealTitle: '双向奔赴 🍁', revealSub: '你们都勇敢表白了，respect。',
    yourPerson: '你的那个人 🫶', letAiCook: '让 AI 安排约会 →', sameTime: '对方在同一刻也知道了 👀',
    step1: '检测到匹配', step2: '读取资料', step3: '读取日历、解析日程',
    step4: '寻找最佳地点', step5: '生成约会方案', step6: '发送确认',
    cookingTitle: 'AI 正在火力全开', cookingSub: '正在为你俩量身规划 ✨',
    now: '进行中', giveItSec: '给它大约 10 秒，咱不糊弄 💅',
    dateCooked: '约会安排好了。🍁', personalized: '根据你们俩的日程定制，绝不糊弄。',
    when: '时间', where: '地点', walkEach: (n: number) => `各步行约 ${n} 分钟`, openMaps: '在地图中打开 →',
    inCommon: '你们的共同点', convStarter: '破冰话题',
    imIn: '我可以，走起 ✓', nah: '算了，没感觉', ghost: '放鸽子 3 次，停用一周 💀',
    happening: '成了！🎉', bothConfirmed: '你俩都确认了，别迟到 😤',
    stayConnected: (name: string) => `和 ${name} 保持联系 📱`, saveNumber: '保存号码，或直接联系 ta',
    addContact: (name: string) => `把 ${name} 加入通讯录`,
    wantDirections: '需要导航吗？🗺️', navigateTo: (v: string) => `导航到 ${v}`, backFeed: '返回 feed',
    stillCooking: 'AI 还在忙… 稍等一下 🍳', checkAgain: '再看看',
    cancelled3: '你已取消 3 次约会，账号暂停一周。',
  },
}

// ─── Verify page ──────────────────────────────────────────────────────────────
export const VERIFY = {
  en: {
    verifying: 'Verifying your email…', youreIn: "you're in!", takingFeed: 'taking you to the feed…',
    expired: 'link expired', invalid: 'this link is invalid or already used', backSignup: 'back to sign up',
  },
  zh: {
    verifying: '正在验证你的邮箱…', youreIn: '验证成功！', takingFeed: '正在带你进入 feed…',
    expired: '链接已失效', invalid: '链接无效或已被使用', backSignup: '返回注册',
  },
}

// ─── Legal pages (privacy / terms) ────────────────────────────────────────────
type Section = { h: string; body: string; list?: string[]; intro?: string }
type Legal = { title: string; updated: string; back: string; sections: Section[] }

export const PRIVACY: Record<Lang, Legal> = {
  en: {
    title: 'Privacy Policy', updated: 'Last updated: April 30, 2026', back: '← back to Maple',
    sections: [
      { h: '1. Who We Are', body: 'Maple ("we", "us", "our") is a campus dating app exclusively for students at the Claremont Colleges (Pitzer, Pomona, Scripps, Claremont McKenna, and Harvey Mudd). We are operated by Maple Inc. and can be reached at hello@maplemeet.ai.' },
      { h: '2. Information We Collect', body: '', list: ['Account info: your name, school email address, gender, dating preferences, and phone number.', 'Location: approximate GPS coordinates, used only to suggest nearby date venues. Never stored long-term or shared.', 'Google Contacts: contact names and email addresses (if you connect your email), used only to show you classmates already on Maple. Never stored on our servers.', 'Usage data: swipes and match interactions, stored to power the matching algorithm.'] },
      { h: '3. How We Use Your Information', body: '', list: ['To show you compatible matches on campus.', 'To send you SMS notifications about matches (via Twilio).', 'To plan date suggestions using your approximate location.', 'To verify you are a current 5C student.'] },
      { h: '4. Information Sharing', body: 'We do not sell your personal data. We share data only with:', list: ['Supabase — database hosting.', 'Twilio — SMS delivery for verification codes and match notifications.', 'Google — Maps API for date venue suggestions.', 'Anthropic / OpenAI — AI-powered date planning (no personal identifiers sent).'] },
      { h: '5. Data Retention', body: 'Your account data is retained as long as your account exists. You may delete your account at any time by emailing hello@maplemeet.ai. Location data is not stored beyond each session.' },
      { h: '6. Security', body: 'We use industry-standard security practices including encrypted connections (HTTPS) and row-level security on our database. Phone numbers are used only for verification and match notifications.' },
      { h: '7. Your Rights', body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us at hello@maplemeet.ai.' },
      { h: '8. Contact', body: 'Questions? Email us at hello@maplemeet.ai.' },
    ],
  },
  zh: {
    title: '隐私政策', updated: '最近更新：2026 年 4 月 30 日', back: '← 返回 Maple',
    sections: [
      { h: '1. 我们是谁', body: 'Maple（"我们"）是一款仅面向克莱蒙特联盟院校（Pitzer、Pomona、Scripps、Claremont McKenna、Harvey Mudd）学生的校园约会应用，由 Maple Inc. 运营。联系方式：hello@maplemeet.ai。' },
      { h: '2. 我们收集的信息', body: '', list: ['账号信息：你的姓名、学校邮箱、性别、约会偏好和手机号。', '位置：大致的 GPS 坐标，仅用于推荐附近的约会地点，不会长期存储或共享。', 'Google 通讯录：联系人姓名和邮箱（若你连接邮箱），仅用于向你展示已在 Maple 的同学，不会存储在我们的服务器上。', '使用数据：滑动和匹配互动，用于支撑匹配算法。'] },
      { h: '3. 我们如何使用这些信息', body: '', list: ['在校园里为你展示合适的匹配对象。', '通过短信（Twilio）向你发送匹配通知。', '基于你的大致位置规划约会建议。', '验证你是在校 5C 学生。'] },
      { h: '4. 信息共享', body: '我们不会出售你的个人数据。我们仅与以下方共享数据：', list: ['Supabase —— 数据库托管。', 'Twilio —— 发送验证码和匹配通知短信。', 'Google —— 用于约会地点建议的地图 API。', 'Anthropic / OpenAI —— AI 约会规划（不发送任何个人身份信息）。'] },
      { h: '5. 数据保留', body: '只要你的账号存在，账号数据就会保留。你可随时发邮件至 hello@maplemeet.ai 删除账号。位置数据不会在单次会话之外存储。' },
      { h: '6. 安全', body: '我们采用行业标准的安全措施，包括加密连接（HTTPS）和数据库行级安全。手机号仅用于验证和匹配通知。' },
      { h: '7. 你的权利', body: '你可随时通过 hello@maplemeet.ai 联系我们，要求访问、更正或删除你的个人数据。' },
      { h: '8. 联系我们', body: '有问题？发邮件至 hello@maplemeet.ai。' },
    ],
  },
}

export const TERMS: Record<Lang, Legal> = {
  en: {
    title: 'Terms of Service', updated: 'Last updated: April 30, 2026', back: '← back to Maple',
    sections: [
      { h: '1. Eligibility', body: 'Maple is exclusively for current students of the Claremont Colleges (Pitzer, Pomona, Scripps, Claremont McKenna, and Harvey Mudd). You must be at least 18 years old and have a valid 5C student email address to use Maple.' },
      { h: '2. Your Account', body: 'You are responsible for maintaining the accuracy of your account information. You may not create an account on behalf of someone else or use a school email you do not own. One account per person.' },
      { h: '3. Acceptable Use', body: 'You agree not to:', list: ['Harass, threaten, or harm other users.', 'Use Maple for any commercial or non-personal purpose.', 'Attempt to reverse-engineer or abuse the platform.', 'Create fake accounts or misrepresent your identity.', "Share another user's information without their consent."] },
      { h: '4. Matches and Interactions', body: 'Maple shows you other students anonymously until a mutual match occurs. Match notifications are sent via SMS. We do not guarantee any specific number of matches or outcomes.' },
      { h: '5. AI-Planned Dates', body: 'When you and another user match, Maple may suggest a date venue using AI and location data. These suggestions are provided for convenience only and are not guarantees of availability, safety, or suitability.' },
      { h: '6. Termination', body: 'We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting hello@maplemeet.ai.' },
      { h: '7. Disclaimer', body: 'Maple is provided "as is" without warranties of any kind. We are not responsible for interactions between users that occur outside the platform. Use good judgment and stay safe.' },
      { h: '8. Changes', body: 'We may update these terms from time to time. Continued use of Maple after changes constitutes acceptance of the new terms.' },
      { h: '9. Contact', body: 'Questions? Email us at hello@maplemeet.ai.' },
    ],
  },
  zh: {
    title: '服务条款', updated: '最近更新：2026 年 4 月 30 日', back: '← 返回 Maple',
    sections: [
      { h: '1. 资格', body: 'Maple 仅面向克莱蒙特联盟院校（Pitzer、Pomona、Scripps、Claremont McKenna、Harvey Mudd）的在校学生。你必须年满 18 岁，并拥有有效的 5C 学生邮箱才能使用 Maple。' },
      { h: '2. 你的账号', body: '你有责任保持账号信息的准确性。你不得代替他人创建账号，或使用不属于你的学校邮箱。每人仅限一个账号。' },
      { h: '3. 可接受的使用', body: '你同意不会：', list: ['骚扰、威胁或伤害其他用户。', '将 Maple 用于任何商业或非个人目的。', '试图逆向工程或滥用平台。', '创建虚假账号或冒充身份。', '未经同意分享其他用户的信息。'] },
      { h: '4. 匹配与互动', body: '在双向匹配成功前，Maple 会匿名地向你展示其他学生。匹配通知通过短信发送。我们不保证任何特定数量的匹配或结果。' },
      { h: '5. AI 规划的约会', body: '当你与另一位用户匹配时，Maple 可能会用 AI 和位置数据推荐约会地点。这些建议仅为方便而提供，不保证可用性、安全性或合适性。' },
      { h: '6. 终止', body: '对于违反本条款的账号，我们保留暂停或终止的权利。你可随时通过 hello@maplemeet.ai 联系我们删除账号。' },
      { h: '7. 免责声明', body: 'Maple 按"现状"提供，不附带任何形式的保证。对于在平台外发生的用户互动，我们不承担责任。请审慎判断、注意安全。' },
      { h: '8. 变更', body: '我们可能会不时更新本条款。变更后继续使用 Maple 即视为接受新条款。' },
      { h: '9. 联系我们', body: '有问题？发邮件至 hello@maplemeet.ai。' },
    ],
  },
}
