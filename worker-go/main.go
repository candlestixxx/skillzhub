package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

func main() {
	redisUrl := os.Getenv("REDIS_URL")
	if redisUrl == "" {
		redisUrl = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisUrl)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}

	client := redis.NewClient(opt)

	// Ping to verify connection
	_, err = client.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	fmt.Println("SkillzHub Go Worker connected to Redis successfully.")
	fmt.Println("Listening for jobs on queue 'video-processing' (simulated)...")

	// Simulated polling loop replacing BullMQ
	for {
		// In a real implementation, we would use BLPOP or XREADGROUP here.
		// For the POC, we just sleep and demonstrate video processing extraction.
		fmt.Println("Polling for video jobs...")

		// Simulate finding a job
		videoUrl := "https://www.w3schools.com/html/mov_bbb.mp4"
		fmt.Printf("Job found. Attempting ffprobe extraction for %s...\n", videoUrl)

		metadata, err := ProbeVideo(videoUrl)
		if err != nil {
			fmt.Printf("ffprobe failed: %v\n", err)
		} else {
			extracted := ExtractMetadata(metadata)
			fmt.Printf("Extracted real metadata: %dx%d @ %dfps, %ds\n", extracted.Width, extracted.Height, extracted.FPS, extracted.Duration)
		}

		time.Sleep(5 * time.Second)
	}
}