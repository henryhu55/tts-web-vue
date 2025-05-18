// import { useI18n } from 'vue-i18n';
// const { t } = useI18n();
import i18n from "@/assets/i18n/i18n";
const { t } = i18n.global;
const styleDes = [
  { keyword: "assistant", emoji: "🔊", word: t("styles.assistant") },
  { keyword: "chat", emoji: "🔊", word: t("styles.chat") },
  {
    keyword: "customerservice",
    emoji: "🔊",
    word: t("styles.customerservice"),
  },
  { keyword: "newscast", emoji: "🎤", word: t("styles.newscast") },
  { keyword: "affectionate", emoji: "😘", word: t("styles.affectionate") },
  { keyword: "angry", emoji: "😡", word: t("styles.angry") },
  { keyword: "calm", emoji: "😶", word: t("styles.calm") },
  { keyword: "cheerful", emoji: "😄", word: t("styles.cheerful") },
  { keyword: "disgruntled", emoji: "😠", word: t("styles.disgruntled") },
  { keyword: "fearful", emoji: "😨", word: t("styles.fearful") },
  { keyword: "gentle", emoji: "😇", word: t("styles.gentle") },
  { keyword: "lyrical", emoji: "😍", word: t("styles.lyrical") },
  { keyword: "sad", emoji: "😭", word: t("styles.sad") },
  { keyword: "serious", emoji: "😐", word: t("styles.serious") },
  { keyword: "poetry-reading", emoji: "🔊", word: t("styles.poetry-reading") },
  {
    keyword: "narration-professional",
    emoji: "👩‍💼",
    word: t("styles.narration-professional"),
  },
  {
    keyword: "newscast-casual",
    emoji: "🔊",
    word: t("styles.newscast-casual"),
  },
  { keyword: "embarrassed", emoji: "😓", word: t("styles.embarrassed") },
  { keyword: "depressed", emoji: "😔", word: t("styles.depressed") },
  { keyword: "envious", emoji: "😒", word: t("styles.envious") },
  {
    keyword: "narration-relaxed",
    emoji: "🎻",
    word: t("styles.narration-relaxed"),
  },
  {
    keyword: "Advertisement_upbeat",
    emoji: "🗣",
    word: t("styles.Advertisement_upbeat"),
  },
  {
    keyword: "Narration-relaxed",
    emoji: "🎻",
    word: t("styles.Narration-relaxed"),
  },
  {
    keyword: "Sports_commentary",
    emoji: "⛹",
    word: t("styles.Sports_commentary"),
  },
  {
    keyword: "Sports_commentary_excited",
    emoji: "🥇",
    word: t("styles.Sports_commentary_excited"),
  },
  {
    keyword: "documentary-narration",
    emoji: "🎞",
    word: t("styles.documentary-narration"),
  },
  { keyword: "excited", emoji: "😁", word: t("styles.excited") },
  { keyword: "friendly", emoji: "😋", word: t("styles.friendly") },
  { keyword: "terrified", emoji: "😱", word: t("styles.terrified") },
  { keyword: "shouting", emoji: "📢", word: t("styles.shouting") },
  { keyword: "unfriendly", emoji: "😤", word: t("styles.unfriendly") },
  { keyword: "whispering", emoji: "😶", word: t("styles.whispering") },
  { keyword: "hopeful", emoji: "☀️", word: t("styles.hopeful") },
];
const roleDes = [
  {
    keyword: "YoungAdultFemale",
    emoji: "👱‍♀️",
    word: t("roles.YoungAdultFemale"),
  },
  { keyword: "YoungAdultMale", emoji: "👱", word: t("roles.YoungAdultMale") },
  {
    keyword: "OlderAdultFemale",
    emoji: "👩",
    word: t("roles.OlderAdultFemale"),
  },
  { keyword: "OlderAdultMale", emoji: "👨", word: t("roles.OlderAdultMale") },
  { keyword: "SeniorFemale", emoji: "👵", word: t("roles.SeniorFemale") },
  { keyword: "SeniorMale", emoji: "👴", word: t("roles.SeniorMale") },
  { keyword: "Girl", emoji: "👧", word: t("roles.Girl") },
  { keyword: "Boy", emoji: "👦", word: t("roles.Boy") },
  { keyword: "Narrator", emoji: "🔊", word: t("roles.Narrator") },
];
const getStyleDes = (key: string) => {
  return styleDes.find((item) => item.keyword === key);
};

const getRoleDes = (key: string) => {
  return roleDes.find((item) => item.keyword === key);
};

export { getStyleDes, getRoleDes };
