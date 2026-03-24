# Stage 1: Build the React Application
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Coolify automatically registers environment variables as build arguments
# We need to map them here so Vite can bundle them into the static files
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_GEMINI_API_KEY

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Build the app for production
RUN npm run build

# Stage 2: Serve the App using Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config to handle SPA routing and caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Coolify maps this to your selected domain: ceo.llamadio.dev)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
