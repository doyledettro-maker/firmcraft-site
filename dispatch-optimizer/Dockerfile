# Firmcraft Dispatch Optimizer
#
# pyvroom ships manylinux wheels for CPython 3.11/3.12 on x86_64, so the slim
# image installs from a wheel and does NOT need a C++ toolchain. If you target
# an architecture without a prebuilt wheel, switch the base to a full image and
# add: build-essential cmake libssl-dev libasio-dev libglpk-dev.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY src/ ./src/

EXPOSE 8080

# Healthcheck hits the FastAPI /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/health').status==200 else 1)"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
