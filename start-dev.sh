#!/bin/bash
cd /home/z/my-project
while true; do
  pgrep -f "next dev" >/dev/null 2>&1 || (nohup bun run dev >> /home/z/my-project/dev.log 2>&1 &) 
  sleep 5
done
