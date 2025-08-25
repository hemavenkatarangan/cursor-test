package com.example.calendar.service;

import com.example.calendar.config.GoogleCalendarProperties;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class GoogleCalendarService {

    private final Calendar calendarClient;
    private final GoogleCalendarProperties properties;

    public GoogleCalendarService(Calendar calendarClient, GoogleCalendarProperties properties) {
        this.calendarClient = calendarClient;
        this.properties = properties;
    }

    public List<Event> getUpcomingEvents(int maxResults) throws IOException {
        String calendarId = properties.getCalendarId();
        Events events = calendarClient
                .events()
                .list(calendarId)
                .setMaxResults(maxResults)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .setTimeMin(new com.google.api.client.util.DateTime(OffsetDateTime.now(ZoneOffset.UTC).toInstant().toEpochMilli()))
                .execute();
        return events.getItems();
    }
}

