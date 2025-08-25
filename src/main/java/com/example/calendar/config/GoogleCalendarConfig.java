package com.example.calendar.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Configuration
public class GoogleCalendarConfig {

    @Bean
    public JsonFactory jsonFactory() {
        return GsonFactory.getDefaultInstance();
    }

    @Bean
    public GoogleCredentials googleCredentials(GoogleCalendarProperties properties) throws IOException {
        String credentialsFile = properties.getCredentialsFile();
        GoogleCredentials baseCredentials;
        if (credentialsFile != null && !credentialsFile.isBlank()) {
            baseCredentials = GoogleCredentials.fromStream(new FileInputStream(credentialsFile));
        } else {
            baseCredentials = GoogleCredentials.getApplicationDefault();
        }
        return baseCredentials.createScoped(Collections.singletonList("https://www.googleapis.com/auth/calendar.readonly"));
    }

    @Bean
    public Calendar calendarClient(JsonFactory jsonFactory,
                                   GoogleCalendarProperties properties,
                                   GoogleCredentials credentials) throws GeneralSecurityException, IOException {
        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                jsonFactory,
                new HttpCredentialsAdapter(credentials)
        ).setApplicationName(properties.getApplicationName())
         .build();
    }
}

