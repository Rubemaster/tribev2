#!/bin/bash
# TRIBE v2 setup script for Vast.ai (or any fresh Ubuntu GPU instance)
# Run as: bash tribev2-setup.sh

set -e

echo "=== TRIBE v2 Setup ==="
echo ""

# --- Step 1: System packages ---
echo "[1/6] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq ffmpeg git python3-pip python3-venv curl 2>/dev/null

# --- Step 2: CUDA check ---
echo "[2/6] Checking GPU..."
nvidia-smi || { echo "No GPU detected! Exiting."; exit 1; }
GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
echo "  GPU: $GPU_NAME"
VRAM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader | head -1)
echo "  VRAM: $VRAM MiB"

# --- Step 3: Python venv ---
echo "[3/6] Setting up Python virtual environment..."
python3 -m venv tribev2-env
source tribev2-env/bin/activate
pip install --upgrade pip -q

# --- Step 4: HuggingFace login ---
echo "[4/6] HuggingFace login..."
echo "  TRIBE v2 uses LLaMA 3.2-3B (gated model)."
echo "  You'll need a HuggingFace token with read access."
echo "  Get one at: https://huggingface.co/settings/tokens"
echo "  Accept the LLaMA license at: https://huggingface.co/meta-llama/Llama-3.2-3B"
echo ""
read -sp "  Paste your HF token (input hidden): " HF_TOKEN
echo ""
huggingface-cli login --token "$HF_TOKEN"

# --- Step 5: Install tribev2 ---
echo "[5/6] Installing tribev2 + plotting (this may take a few minutes)..."
pip install "tribev2[plotting] @ git+https://github.com/facebookresearch/tribev2.git" -q

# --- Step 6: Verify ---
echo "[6/6] Verifying installation..."
python3 -c "
from tribev2.demo_utils import TribeModel
print('  ✓ tribev2 imported successfully')
# Quick model load test (will download ~1GB on first run)
model = TribeModel.from_pretrained('facebook/tribev2', cache_folder='./cache')
print('  ✓ Model loaded successfully')
print('  ✓ Setup complete!')
"

echo ""
echo "=== Done! ==="
echo "To reactivate later: source tribev2-env/bin/activate"
