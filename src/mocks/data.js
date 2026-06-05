// ============================================================
// 完整用户数据 (QQ + OnlyFans 混合模型)
// ============================================================

// 当前登录用户
export const currentUser = {
  id: "u_self",
  name: "Warm Circle",
  username: "@warmcircle",
  avatar: "Warm Circle",
  bio: "Creators & Curators of Culture.",
  isCreator: true,
  price: 9.99,
  energy: 720,
  level: "craftsman",
  contribution: 48,
  stats: { followers: "12.5k", following: 328, subscribed: 89 },
  portfolio: [
    { id: "p1", title: "晨光系列 #1", likes: 234, comments: 18, purchases: 12, creatorId: "u_self" },
    { id: "p2", title: "城市漫步", likes: 189, comments: 24, purchases: 8, creatorId: "u_self" },
    { id: "p3", title: "温暖瞬间", likes: 312, comments: 45, purchases: 27, creatorId: "u_self" },
    { id: "p4", title: "秋日物语", likes: 156, comments: 11, purchases: 5, creatorId: "u_self" },
    { id: "p5", title: "街头光影", likes: 278, comments: 33, purchases: 19, creatorId: "u_self" },
    { id: "p6", title: "日常美学", likes: 145, comments: 9, purchases: 4, creatorId: "u_self" },
  ],
  hostedEvents: ["e3", "e4"],
  joinedEvents: ["e1"],
};

// ============================================================
// 所有用户 / 创作者 (统一结构)
// ============================================================
export const users = {
  u_self: {
    id: "u_self",
    name: "Warm Circle",
    avatar: "Warm Circle",
    bio: "Creators & Curators of Culture.",
    isCreator: true,
    isSubscribed: false,
    isFollowing: false,
    price: 9.99,
    followers: "12.5k",
    following: 328,
    energy: 720,
    level: "craftsman",
    contribution: 48,
    coverGradient: "from-[#ff9d5c] to-[#2d7d4e]",
  },
  u1: {
    id: "u1",
    name: "Alice Wong",
    avatar: "Alice Wong",
    bio: "Coffee lover · 生活记录者",
    isCreator: true,
    isSubscribed: false,   // 当前用户是否已订阅
    isFollowing: false,    // 当前用户是否已关注
    price: 4.99,
    followers: "2.3k",
    following: 180,
    energy: 230,
    level: "warm",
    contribution: 20,
    coverGradient: "from-[#356668] to-[#b9ecee]",
  },
  u2: {
    id: "u2",
    name: "小明",
    avatar: "小明",
    bio: "爬山爱好者 🏔️",
    isCreator: false,
    isSubscribed: false,
    isFollowing: true,
    price: 0,
    followers: "328",
    following: 56,
    energy: 45,
    level: "novice",
    contribution: 5,
    coverGradient: "from-[#ff9d5c] to-[#2d7d4e]",
  },
  u3: {
    id: "u3",
    name: "Alex Chen",
    avatar: "Alex Chen",
    bio: "时尚穿搭 · 生活方式",
    isCreator: true,
    isSubscribed: false,
    isFollowing: false,
    price: 9.99,
    followers: "12.5k",
    following: 234,
    energy: 1500,
    level: "craftsman",
    contribution: 75,
    coverGradient: "from-[#ffdbc8] to-[#ff9d5c]",
  },
  u4: {
    id: "u4",
    name: "Sarah Fit",
    avatar: "Sarah Fit",
    bio: "健身教练 · 健康饮食",
    isCreator: true,
    isSubscribed: false,
    isFollowing: false,
    price: 0,
    followers: "8.3k",
    following: 120,
    energy: 320,
    level: "warm",
    contribution: 30,
    coverGradient: "from-[#b9ecee] to-[#356668]",
  },
  u5: {
    id: "u5",
    name: "Mia Arts",
    avatar: "Mia Arts",
    bio: "插画师 · 艺术创作",
    isCreator: true,
    isSubscribed: false,
    isFollowing: true,
    price: 4.99,
    followers: "6.7k",
    following: 89,
    energy: 850,
    level: "craftsman",
    contribution: 55,
    coverGradient: "from-[#c9c6be] to-[#605e58]",
  },
  u6: {
    id: "u6",
    name: "Leo Music",
    avatar: "Leo Music",
    bio: "独立音乐人 · 吉他手",
    isCreator: true,
    isSubscribed: true,    // 已订阅
    isFollowing: false,
    price: 2.99,
    followers: "15.2k",
    following: 310,
    energy: 2800,
    level: "partner",
    contribution: 90,
    coverGradient: "from-[#ffb68a] to-[#2d7d4e]",
  },
  u7: {
    id: "u7",
    name: "Brew & Bake",
    avatar: "Brew Bake",
    bio: "精品咖啡 · 手工烘焙",
    isCreator: false,
    isSubscribed: false,
    isFollowing: false,
    price: 0,
    followers: "4.1k",
    following: 45,
    energy: 80,
    level: "novice",
    contribution: 8,
    coverGradient: "from-[#e6e2d9] to-[#484741]",
  },
};

// ============================================================
// 消息列表 (每条消息关联一个 userId，公开回复互动)
// ============================================================
export const chatList = [
  {
    id: "chat1",
    userId: "u1",
    type: "personal",
    time: "10 mins ago",
    distance: "50m away",
    message: "Anyone up for a coffee at the corner shop? ☕️",
    unread: 0,
    color: "#356668",
    replies: [
      { id: "r1", userId: "u2", text: "我也去！几点？", time: "10:40 AM" },
      { id: "r2", userId: "u_self", text: "算我一个 ☕", time: "10:45 AM" },
    ],
  },
  {
    id: "chat2",
    userId: "u6",
    type: "personal",
    time: "1h ago",
    distance: "-",
    message: "Thanks for subscribing! 🎉",
    unread: 3,
    color: "#356668",
    replies: [
      { id: "r3", userId: "u3", text: "新歌超好听！", time: "1:30 PM" },
    ],
  },
  {
    id: "chat3",
    userId: "u7",
    type: "merchant",
    time: "3h ago",
    distance: "150m away",
    message: "Fresh batch of croissants just came out! 🥐",
    unread: 0,
    color: "#9B51E0",
    replies: [],
  },
  {
    id: "chat4",
    userId: "u2",
    type: "personal",
    time: "昨天",
    distance: "200m away",
    message: "周末一起去爬山？",
    unread: 1,
    color: "#356668",
    replies: [
      { id: "r4", userId: "u4", text: "哪里爬？求带", time: "昨天 9:00 PM" },
      { id: "r5", userId: "u_self", text: "白河湿地公园不错", time: "昨天 10:00 PM" },
    ],
  },
];

// ============================================================
// 聊天记录
// ============================================================
export const chatMessages = {
  chat1: [
    { id: "m1", senderId: "u1", text: "Hey there! How are you?", time: "10:30 AM" },
    { id: "m2", senderId: "self", text: "I'm great, thanks! ☀️", time: "10:32 AM" },
    { id: "m3", senderId: "u1", text: "Anyone up for a coffee at the corner shop? ☕️", time: "10:35 AM" },
  ],
  chat2: [
    { id: "m8", senderId: "u6", text: "Thanks for subscribing! 🎉", time: "1:00 PM" },
    { id: "m9", senderId: "u6", text: "Check out my new track on the profile page", time: "1:02 PM" },
  ],
  chat3: [
    { id: "m10", senderId: "u7", text: "Fresh batch of croissants just came out! 🥐 20% off for locals today.", time: "2:00 PM" },
  ],
  chat4: [
    { id: "m11", senderId: "u2", text: "周末一起去爬山？", time: "昨天 8:00 PM" },
  ],
};

// ============================================================
// 群组
// ============================================================
export const groups = [
  {
    id: "g1",
    name: "南阳周末露营小分队",
    avatar: "南阳周末露营小分队",
    tags: ["南阳 (Nanyang)", "#Camping"],
    lastMessage: "这周六白河湿地公园见，记得带帐篷哦！",
    sender: "@李队长",
    time: "10:42 AM",
    unread: 3,
    memberCount: 128,
    isPublic: true,
    isJoined: true,
    joinStatus: "joined", // "none" | "applied" | "joined"
    desc: "本群组致力于为南阳及周边地区的户外爱好者提供一个交流平台。我们会定期组织周末露营、轻量化登山等活动。",
  },
  {
    id: "g2",
    name: "装备交流 & 二手闲置",
    avatar: "装备交流",
    time: "昨天",
    lastMessage: "求购一个轻量化睡袋，有的私。",
    sender: "",
    memberCount: 456,
    isPublic: true,
    isJoined: true,
    joinStatus: "joined",
    desc: "在这里你可以交换或购买二手户外装备。",
  },
  {
    id: "g3",
    name: "南阳徒步爱好者",
    avatar: "南阳徒步爱好者",
    desc: "下周日老界岭徒步，名额有限！",
    tags: ["热门推荐", "#Hiking"],
    memberCount: 234,
    isPublic: true,
    isJoined: false,
    joinStatus: "none",
  },
  {
    id: "g4",
    name: "光影社-摄影交流",
    avatar: "光影社-摄影交流",
    desc: "本月最佳摄影作品评选中...",
    tags: ["热门推荐", "#Photography"],
    memberCount: 189,
    isPublic: false,
    isJoined: false,
    joinStatus: "none",
  },
];

// ============================================================
// 活动
// ============================================================
export const events = [
  {
    id: "e1",
    title: "Sunset Yoga Session",
    location: "滨江公园",
    time: "今天, 5:30 PM",
    tag: "热门活动",
    isPublic: false,
    joinStatus: "registered",
    desc: "在落日余晖中放松身心，专业瑜伽导师带领。",
    organizer: "Sarah Fit",
    hostId: "u4",
  },
  {
    id: "e2",
    title: "Indie Music Night",
    location: "The Blue Room",
    time: "周六, 8:00 PM",
    tag: "热门活动",
    isPublic: true,
    joinStatus: "none",
    desc: "独立音乐人现场演出，感受最纯粹的音乐。",
    organizer: "Leo Music",
    hostId: "u6",
  },
  {
    id: "e3",
    title: "周日露营 · 白河湿地",
    location: "白河湿地公园",
    time: "周日, 9:00 AM",
    tag: "我发起的",
    isPublic: true,
    joinStatus: "registered",
    desc: "自带帐篷和食材，欢迎大家一起来烧烤露营！",
    organizer: "Warm Circle",
    hostId: "u_self",
  },
  {
    id: "e4",
    title: "老界岭徒步召集",
    location: "老界岭风景区",
    time: "下周六, 7:00 AM",
    tag: "我发起的",
    isPublic: true,
    joinStatus: "registered",
    desc: "名额有限，全程约8小时，需要一定体力。",
    organizer: "Warm Circle",
    hostId: "u_self",
  },
];

// ============================================================
// userId → chatId 映射 (用于新建对话时跳转)
// ============================================================
export const userChatMap = {
  u1: "chat1",
  u2: "chat4",
  u6: "chat2",
  u7: "chat3",
};

// ============================================================
// 筛选选项
// ============================================================
export const filterOptions = {
  categories: ["全部", "户外", "摄影", "运动", "音乐", "美食"],
  distances: ["1km内", "5km内", "10km内", "全城"],
  activeTimes: ["最近活跃", "今日新增", "本周热门"],
};
