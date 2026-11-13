// Backend en el puerto 8081, para equipos donde el 8080 está ocupado (por ejemplo, NVIDIA Broadcast).
//   backend:  ./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
//   frontend: npx ng serve --configuration puerto-8081
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/api',
};
