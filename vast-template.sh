#!/bin/bash
# Vast.ai onstart script for TRIBE v2 template
set -e

echo "=== TRIBE v2 Instance Setup ==="

# System deps
apt-get update -qq && apt-get install -y -qq ffmpeg

# PyTorch with CUDA 13
pip3 install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cu130

# TRIBE v2 + plotting
pip3 install --no-cache-dir "tribev2[plotting] @ git+https://github.com/facebookresearch/tribev2.git"

# API server deps
pip3 install --no-cache-dir fastapi uvicorn python-multipart

# Download model weights (pre-cache)
python3 -c "
from tribev2.demo_utils import TribeModel
TribeModel.from_pretrained('facebook/tribev2', cache_folder='./cache')
print('Model cached.')
"

# Start API server
mkdir -p /root/tribev2-backend
nohup python3 /root/tribev2-backend/server.py > /tmp/tribev2-server.log 2>&1 &

echo "=== Ready ==="
