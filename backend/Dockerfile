FROM oven/bun:alpine

WORKDIR /app

VOLUME [ "/data", "/files", "/temp" ]

# Install dependencies
RUN apk add --no-cache ffmpeg imagemagick

COPY package.json bun.lock* ./

RUN bun install

COPY . .

EXPOSE 3463

CMD ["bun", "run", "start"]
