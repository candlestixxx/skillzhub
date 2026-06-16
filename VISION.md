# SkillzHub Vision

## The Problem
Robotics companies (Tesla, Figure, Boston Dynamics, OpenAI) are bottlenecked by high-variety, real-world embodied data. They need vast amounts of first-person video of specific tasks (e.g., picking up an object, navigating a cluttered space, using a tool) to train visuomotor policies and imitation learning models.

## The Solution
SkillzHub is an autonomous C2B marketplace that connects creators equipped with GoPro/FPV cameras to AI/robotics companies. It acts as the "Uber for AI training footage," aiming for a zero-touch pipeline where data flows from capture to dataset with minimal manual intervention.

## Core Loops
1. **Companies** post data missions with specific constraints (FPS, resolution, environment, task) and optional "boosts" to incentivize rapid collection.
2. **Creators** browse missions, capture footage, and upload it. Their reputation and "Trust Tier" determine how quickly their data is integrated.
3. **The Platform** automatically processes (ffmpeg), QCs, and labels (VLM/pose estimation) the footage, drastically reducing annotation costs and latency.
4. **Autonomous Acceptance**: High-trust creators benefit from automated acceptance upon passing technical QC, while others enter a streamlined review queue.
5. **Datasets**: Accepted footage triggers payouts and is immediately indexed into clean, legally-safe datasets available via an API for robotic training pipelines.

## The Moat
Our task ontology and mission system structure unstructured video into actionable training data. We handle the difficult licensing, quality control, and data pipeline logistics.
