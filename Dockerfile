FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including devDependencies like tsx and typescript)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Express server
CMD ["npm", "start"]
