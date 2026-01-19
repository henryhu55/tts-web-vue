export const DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural";

export interface SsmlBuildParams {
  text: string;
  voice: string;
  style: string;
  role: string;
  speed: number;
  pitch: number;
  intensity?: string;
  volume?: string;
  silence?: string;
}

function normalizeIntensity(intensity?: string): string {
  if (!intensity || intensity === "default") {
    return "";
  }

  if (intensity === "weak") return "0.5";
  if (intensity === "strong") return "1.5";
  if (intensity === "extraStrong") return "2";

  return intensity;
}

function normalizeVolume(volume?: string): string {
  if (!volume || volume === "default") {
    return "";
  }

  const volumeMapping: Record<string, string> = {
    extraWeak: "x-soft",
    weak: "soft",
    medium: "medium",
    strong: "loud",
    extraStrong: "x-loud"
  };

  return volumeMapping[volume] || volume;
}

export function buildSsml(params: SsmlBuildParams): string {
  const {
    text,
    voice,
    style,
    role,
    speed,
    pitch,
    intensity,
    volume,
    silence
  } = params;

  const rate = (speed - 1) * 100;
  const pitchValue = (pitch - 1) * 50;
  const intensityValue = normalizeIntensity(intensity);
  const volumeValue = normalizeVolume(volume);

  const intensityAttr = intensityValue ? ` styledegree="${intensityValue}"` : "";
  const volumeAttr = volumeValue ? ` volume="${volumeValue}"` : "";
  const silenceConfig = silence && silence !== "default" ? `<break time="${silence}" />` : "";
  const styleAttr = style !== "General" ? `style="${style}"` : "";
  const roleAttr = role !== "Default" ? ` role="${role}"` : "";

  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
        <voice name="${voice}">
            <mstts:express-as ${styleAttr}${roleAttr}${intensityAttr}>
                <prosody rate="${rate}%" pitch="${pitchValue}%"${volumeAttr}>
                ${silenceConfig}${text}
                </prosody>
            </mstts:express-as>
        </voice>
      </speak>`;
}
