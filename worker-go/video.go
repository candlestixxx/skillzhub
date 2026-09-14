package main

import (
	"encoding/json"
	"math"
	"os/exec"
	"strconv"
	"strings"
)

type VideoMetadata struct {
	Width    int
	Height   int
	FPS      int
	Duration int
}

type FFprobeOutput struct {
	Streams []struct {
		CodecType  string `json:"codec_type"`
		Width      int    `json:"width"`
		Height     int    `json:"height"`
		RFrameRate string `json:"r_frame_rate"`
	} `json:"streams"`
	Format struct {
		Duration string `json:"duration"`
	} `json:"format"`
}

// ProbeVideo executes ffprobe against a given URL/path and extracts JSON.
func ProbeVideo(url string) (*FFprobeOutput, error) {
	cmd := exec.Command("ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", url)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var data FFprobeOutput
	if err := json.Unmarshal(output, &data); err != nil {
		return nil, err
	}

	return &data, nil
}

// ExtractMetadata extracts normalized metadata from ffprobe output.
func ExtractMetadata(metadata *FFprobeOutput) VideoMetadata {
	width := 1920
	height := 1080
	fps := 60
	duration := 120

	for _, s := range metadata.Streams {
		if s.CodecType == "video" {
			if s.Width > 0 {
				width = s.Width
			}
			if s.Height > 0 {
				height = s.Height
			}
			if s.RFrameRate != "" {
				parts := strings.Split(s.RFrameRate, "/")
				if len(parts) == 2 {
					num, err1 := strconv.Atoi(parts[0])
					den, err2 := strconv.Atoi(parts[1])
					if err1 == nil && err2 == nil && den != 0 {
						fps = int(math.Round(float64(num) / float64(den)))
					}
				}
			}
			break
		}
	}

	if metadata.Format.Duration != "" {
		if dur, err := strconv.ParseFloat(metadata.Format.Duration, 64); err == nil {
			duration = int(math.Round(dur))
		}
	}

	return VideoMetadata{
		Width:    width,
		Height:   height,
		FPS:      fps,
		Duration: duration,
	}
}
