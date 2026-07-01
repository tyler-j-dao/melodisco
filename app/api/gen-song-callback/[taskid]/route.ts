import { findSongTaskByUuid, updateSongTask } from "@/models/task";
import { findByUuid, updateSong } from "@/models/song";
import { respErr, respOk } from "@/utils/resp";

import { Song } from "@/types/song";
import { getIsoTimestr } from "@/utils";

export async function POST(
  req: Request,
  { params }: { params: { taskid: string } }
) {
  try {
    const { taskid } = params;
    if (!taskid) {
      return respErr("invalid taskid");
    }

    const body = await req.json();
    console.log("gen song callback data", taskid, body);

    const songTask = await findSongTaskByUuid(taskid);
    if (!songTask) {
      console.log("song task not found for callback:", taskid);
      return respErr("task not found");
    }

    const code = body["code"];
    if (code !== undefined && code !== 200) {
      songTask.status = "failed";
      songTask.updated_at = getIsoTimestr();
      await updateSongTask(songTask);
      return respOk();
    }

    // SunoAPI-style wrapper callback shape: { code, data: { data: [clip, ...] } }.
    // Falls back to a flat "clips" array to match the shape used elsewhere in
    // this codebase (services/suno.ts) in case the provider sends that instead.
    const inner = body["data"];
    const clips: any[] = Array.isArray(inner?.data)
      ? inner.data
      : Array.isArray(body["clips"])
      ? body["clips"]
      : [];

    let completedCount = 0;

    for (const clip of clips) {
      const uuid = clip["id"];
      if (!uuid) {
        continue;
      }

      const audio_url = clip["audio_url"] || clip["source_audio_url"];
      if (!audio_url) {
        // Provider hasn't finished rendering this clip yet — nothing to persist.
        continue;
      }

      const existing = await findByUuid(uuid);
      if (!existing) {
        console.log("no matching song row for callback clip:", uuid);
        continue;
      }

      const song: Song = {
        ...existing,
        audio_url,
        video_url: clip["video_url"] || existing.video_url,
        image_url:
          clip["image_url"] || clip["source_image_url"] || existing.image_url,
        duration: clip["duration"] || existing.duration,
        title: clip["title"] || existing.title,
        tags: clip["tags"] || existing.tags,
        status: "complete",
      };

      await updateSong(song);
      completedCount += 1;
    }

    if (completedCount > 0) {
      songTask.status = "complete";
      songTask.updated_at = getIsoTimestr();
      await updateSongTask(songTask);
    }

    return respOk();
  } catch (e) {
    console.log("gen song callback failed:", e);
    return respErr("callback failed");
  }
}
