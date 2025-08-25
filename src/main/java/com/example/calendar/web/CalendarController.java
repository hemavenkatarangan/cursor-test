package com.example.calendar.web;

import com.google.api.services.calendar.model.Event;
import com.example.calendar.service.GoogleCalendarService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final GoogleCalendarService googleCalendarService;

    public CalendarController(GoogleCalendarService googleCalendarService) {
        this.googleCalendarService = googleCalendarService;
    }

    @GetMapping("/events")
    public List<Event> getEvents(@RequestParam(name = "max", defaultValue = "10") int max) throws IOException {
        return googleCalendarService.getUpcomingEvents(max);
    }
}

