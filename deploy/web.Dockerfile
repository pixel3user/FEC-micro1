FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /workspace
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/index.html ./apps/web/
RUN pnpm install --frozen-lockfile
COPY packages/contracts/src ./packages/contracts/src
COPY apps/web/src ./apps/web/src
RUN pnpm --filter @agent-web/contracts build && pnpm --filter @agent-web/web build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
