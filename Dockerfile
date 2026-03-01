# Stage 1 : Build avec Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances en premier pour profiter du cache Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copie du code source et build
COPY src ./src
RUN mvn -DskipTests clean install -B

# Stage 2 : Image de production légère
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copie du jar depuis le stage de build
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "app.jar"]