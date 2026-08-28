import {
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_FRAMES,
} from "@/src/lib/photoConfig";

const VIDEO_LOAD_TIMEOUT = 20_000;
const MAX_FRAME_EDGE = 1280;
const FRAME_QUALITY = 0.76;

function waitForVideoEvent(
  video: HTMLVideoElement,
  eventName: "loadedmetadata" | "loadeddata" | "seeked",
) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("video_unreadable"));
    }, VIDEO_LOAD_TIMEOUT);

    const handleSuccess = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("video_unreadable"));
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(eventName, handleSuccess);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener(eventName, handleSuccess, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

async function createReadableVideo(file: File) {
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");

  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = sourceUrl;

  try {
    const metadataPromise = waitForVideoEvent(
      video,
      "loadedmetadata",
    );
    video.load();
    await metadataPromise;

    if (
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      throw new Error("video_unreadable");
    }

    return { video, sourceUrl };
  } catch (error) {
    URL.revokeObjectURL(sourceUrl);
    video.removeAttribute("src");
    video.load();
    throw error;
  }
}

function releaseVideo(
  video: HTMLVideoElement,
  sourceUrl: string,
) {
  video.pause();
  video.removeAttribute("src");
  video.load();
  URL.revokeObjectURL(sourceUrl);
}

export async function getVideoDuration(file: File) {
  const { video, sourceUrl } = await createReadableVideo(file);

  try {
    return video.duration;
  } finally {
    releaseVideo(video, sourceUrl);
  }
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  filename: string,
) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("video_unreadable"));
          return;
        }

        resolve(
          new File([blob], filename, {
            type: "image/jpeg",
          }),
        );
      },
      "image/jpeg",
      FRAME_QUALITY,
    );
  });
}

export async function extractVideoFrames(file: File) {
  const { video, sourceUrl } = await createReadableVideo(file);

  try {
    if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
      throw new Error("video_too_long");
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForVideoEvent(video, "loadeddata");
    }

    const frameCount =
      video.duration <= 10 ? 6 : MAX_VIDEO_FRAMES;
    const start = Math.min(0.15, video.duration * 0.03);
    const end = Math.max(start, video.duration - 0.15);
    const timestamps = Array.from(
      { length: frameCount },
      (_, index) =>
        start +
        ((end - start) * index) /
          (frameCount - 1),
    );

    const scale = Math.min(
      1,
      MAX_FRAME_EDGE /
        Math.max(video.videoWidth, video.videoHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(
      1,
      Math.round(video.videoWidth * scale),
    );
    canvas.height = Math.max(
      1,
      Math.round(video.videoHeight * scale),
    );
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("video_unreadable");
    }

    const frames: File[] = [];

    for (let index = 0; index < timestamps.length; index++) {
      if (Math.abs(video.currentTime - timestamps[index]) > 0.01) {
        const seekPromise = waitForVideoEvent(video, "seeked");
        video.currentTime = timestamps[index];
        await seekPromise;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(
        await canvasToFile(
          canvas,
          `video-frame-${String(index + 1).padStart(2, "0")}.jpg`,
        ),
      );
    }

    return frames;
  } finally {
    releaseVideo(video, sourceUrl);
  }
}
