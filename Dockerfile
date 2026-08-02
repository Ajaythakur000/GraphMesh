# 1. Base Image - Node.js aur Linux environment
FROM node:18-bullseye

# 2. C++ Compiler (g++) install karo
RUN apt-get update && apt-get install -y g++

# 3. Work Directory set karo
WORKDIR /app

# 4. Saara code container mein copy karo
COPY . .

# 5. C++ Engine ko Linux ke liye compile karo (windows ki .exe nahi chalegi, isliye naya build)
RUN cd engine && g++ main.cpp -o engine

# 6. Next.js Frontend ka setup karo
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# 7. Port 3000 expose karo (Render isko use karega)
EXPOSE 3000

# 8. Next.js server start karo
CMD ["npm", "start"]