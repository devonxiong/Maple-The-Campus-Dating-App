// Shared language helpers + feed dictionary.
export type Lang = 'en' | 'zh'

export function readLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const v = localStorage.getItem('maple_lang')
  return v === 'zh' ? 'zh' : 'en'
}

export function writeLang(lang: Lang) {
  if (typeof window !== 'undefined') localStorage.setItem('maple_lang', lang)
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
