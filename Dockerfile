# BUILD STAGE
FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY ["tsconfig.json", "package.json", "package-lock.json", ".env", "./"]
COPY ./prisma ./prisma
COPY ./src ./src

RUN npm install
RUN npm run build

# RUN STAGE
FROM node:22-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY ./prisma ./prisma
COPY .env .env

# install Vecna font to image
RUN apk add fontconfig
COPY ./resources/fonts/*.ttf /usr/share/fonts/truetype
RUN fc-cache -f -v

RUN apk add openssl

CMD npm run start:migrate:dev
