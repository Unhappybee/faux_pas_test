
    FROM node:22-alpine AS builder
    
    WORKDIR /app

    COPY package*.json ./

    RUN npm install

    COPY . .

    RUN npm run build
    
    FROM nginx:1.27-alpine 

    RUN rm -rf /usr/share/nginx/html/*
    RUN rm -f /etc/nginx/conf.d/default.conf
    
    COPY --from=builder /app/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/conf.d/custom-app.conf

    EXPOSE 80

    CMD ["nginx", "-g", "daemon off;"]