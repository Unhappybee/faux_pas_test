FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./ 
RUN npm install
COPY prisma ./prisma/
COPY . .
RUN npx prisma generate
RUN npm run build 

FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma/
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/dist_scripts ./dist_scripts 

EXPOSE 8080
CMD ["sh", "-c", "echo 'Attempting to apply migrations...' && npx prisma migrate deploy && echo 'Migrations applied. Starting application...' && node dist/server.js"]