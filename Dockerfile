FROM vastai/pytorch:2.11.0-cu130-cuda-13.2-mini-py314-2026-04-15

# System deps
RUN apt-get update -qq && apt-get install -y -qq ffmpeg && rm -rf /var/lib/apt/lists/*

# TRIBE v2 + plotting + API deps
RUN pip3 install --no-cache-dir \
    "tribev2[plotting] @ git+https://github.com/facebookresearch/tribev2.git" \
    fastapi uvicorn python-multipart

# Pre-cache TRIBE v2 model weights
RUN python3 -c "from tribev2.demo_utils import TribeModel; TribeModel.from_pretrained('facebook/tribev2', cache_folder='/root/cache')"

# Backend server
RUN mkdir -p /root/tribev2-backend
COPY tribev2-backend/server.py /root/tribev2-backend/server.py

# Expose API port
EXPOSE 9000

# Start API server on boot
CMD ["python3", "/root/tribev2-backend/server.py"]
