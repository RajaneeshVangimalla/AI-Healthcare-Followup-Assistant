FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -DskipTests

COPY src/ src/
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

RUN groupadd --system spring && useradd --system --gid spring spring

COPY --from=build --chown=spring:spring \
    /workspace/target/healthai-0.0.1-SNAPSHOT.jar \
    /app/healthai-0.0.1-SNAPSHOT.jar

USER spring:spring

EXPOSE 8080

CMD ["sh", "-c", "exec java -jar /app/healthai-0.0.1-SNAPSHOT.jar --server.port=${PORT:-8080}"]
