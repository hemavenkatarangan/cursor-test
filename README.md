# Calendar Demo (Spring Boot + Google Calendar API)

Steps:

- Enable Google Calendar API in Google Cloud.
- Create a Service Account and download the JSON key.
- Share the calendar with the service account email.

Configure credentials:

- Either set env var `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of the JSON key
- Or set `google.calendar.credentials-file` in `src/main/resources/application.yml`

Run:

```bash
mvn spring-boot:run
```

Endpoint:

- GET `/api/calendar/events?max=10`