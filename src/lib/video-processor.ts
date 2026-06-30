import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export interface VideoMetadata {
    width: number;
    height: number;
    fps: number;
    duration: number;
}

export function probeVideo(url: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(url, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
        });
    });
}

/**
 * Extracts normalized metadata from ffprobe output.
 */
export function extractMetadata(metadata: ffmpeg.FfprobeData): VideoMetadata {
    let width = 1920;
    let height = 1080;
    let fps = 60;
    let duration = 120;

    const videoStream = metadata.streams.find(s => s.codec_type === 'video');

    if (videoStream) {
        width = videoStream.width || width;
        height = videoStream.height || height;

        if (videoStream.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/');
            if (num && den) {
                fps = Math.round(parseInt(num) / parseInt(den));
            }
        }
    }

    if (metadata.format?.duration) {
        duration = Math.round(metadata.format.duration);
    }

    return { width, height, fps, duration };
}
